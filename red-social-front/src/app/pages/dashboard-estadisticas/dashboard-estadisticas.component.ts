import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { EstadisticasService } from '../../services/estadisticas.service';
import { ModalService } from '../../services/modal.service';

Chart.register(...registerables);

const PALETA = ['#f28c38', '#57bceb', '#7bc4a4', '#d11d1d', '#9b6bd1', '#f7c948', '#4f6d7a', '#e07aa8', '#8cc152', '#a0522d'];

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
const haceDias = (n: number) => iso(new Date(Date.now() - n * 86400000));

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './dashboard-estadisticas.component.html',
})
export class DashboardEstadisticasComponent implements AfterViewInit, OnDestroy {
  private service = inject(EstadisticasService);
  private modal = inject(ModalService);

  canvasTorta = viewChild.required<ElementRef<HTMLCanvasElement>>('torta');
  canvasLinea = viewChild.required<ElementRef<HTMLCanvasElement>>('linea');
  canvasBarras = viewChild.required<ElementRef<HTMLCanvasElement>>('barras');

  desde = signal(haceDias(30));
  hasta = signal(iso(new Date()));
  cargando = signal(false);

  vacioTorta = signal(false);
  vacioLinea = signal(false);
  vacioBarras = signal(false);
  totalComentarios = signal(0);

  private charts: Record<string, Chart | undefined> = {};

  ngAfterViewInit() {
    this.cargar();
  }

  ngOnDestroy() {
    Object.values(this.charts).forEach((c) => c?.destroy());
  }

  rapido(dias: number) {
    this.desde.set(haceDias(dias));
    this.hasta.set(iso(new Date()));
    this.cargar();
  }

  cargar() {
    if (!this.desde() || !this.hasta()) {
      this.modal.error('Fechas incompletas', 'Elegí las dos fechas del período.');
      return;
    }
    if (this.desde() > this.hasta()) {
      this.modal.error('Período inválido', 'La fecha "desde" no puede ser posterior a "hasta".');
      return;
    }

    this.cargando.set(true);
    forkJoin({
      pubs: this.service.publicacionesPorUsuario(this.desde(), this.hasta()),
      coms: this.service.comentarios(this.desde(), this.hasta()),
      porPub: this.service.comentariosPorPublicacion(this.desde(), this.hasta()),
    }).subscribe({
      next: ({ pubs, coms, porPub }) => {
        this.cargando.set(false);
        this.dibujarTorta(pubs);
        this.dibujarLinea(coms);
        this.dibujarBarras(porPub);
      },
      error: (err) => {
        this.cargando.set(false);
        this.modal.error('No se pudieron cargar las estadísticas', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  private dibujar(clave: string, canvas: HTMLCanvasElement, config: any, hayDatos: boolean) {
    this.charts[clave]?.destroy();
    this.charts[clave] = undefined;
    if (hayDatos) this.charts[clave] = new Chart(canvas, config);
  }

  private dibujarTorta(datos: { usuario: string; cantidad: number }[]) {
    this.vacioTorta.set(datos.length === 0);
    this.dibujar('torta', this.canvasTorta().nativeElement, {
      type: 'pie',
      data: {
        labels: datos.map((d) => '@' + d.usuario),
        datasets: [{ data: datos.map((d) => d.cantidad), backgroundColor: PALETA }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    }, datos.length > 0);
  }

  private dibujarLinea(res: { total: number; items: { fecha: string; cantidad: number }[] }) {
    this.vacioLinea.set(res.items.length === 0);
    this.totalComentarios.set(res.total);
    this.dibujar('linea', this.canvasLinea().nativeElement, {
      type: 'line',
      data: {
        labels: res.items.map((i) => i.fecha.split('-').reverse().join('/')),
        datasets: [{
          label: 'Comentarios',
          data: res.items.map((i) => i.cantidad),
          borderColor: '#f28c38',
          backgroundColor: 'rgba(242, 140, 56, 0.2)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } },
      },
    }, res.items.length > 0);
  }

  private dibujarBarras(datos: { publicacion: string; cantidad: number }[]) {
    this.vacioBarras.set(datos.length === 0);
    const recortar = (t: string) => (t.length > 25 ? t.substring(0, 25) + '…' : t);
    this.dibujar('barras', this.canvasBarras().nativeElement, {
      type: 'bar',
      data: {
        labels: datos.map((d) => recortar(d.publicacion)),
        datasets: [{ label: 'Comentarios', data: datos.map((d) => d.cantidad), backgroundColor: '#57bceb' }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } },
      },
    }, datos.length > 0);
  }
}