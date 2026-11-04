import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { PublicacionCardComponent } from '../../shared/publicacion-card/publicacion-card.component';
import { Publicacion, PublicacionesService } from '../../services/publicaciones.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [NavbarComponent, PublicacionCardComponent, ReactiveFormsModule],
  templateUrl: './publicaciones.component.html',
})
export class PublicacionesComponent implements OnInit {
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);
  private fb = inject(FormBuilder);

  archivoInput = viewChild<ElementRef<HTMLInputElement>>('archivo');

  usuario = JSON.parse(localStorage.getItem('usuario') ?? 'null');
  items = signal<Publicacion[]>([]);
  total = signal(0);
  cargando = signal(false);
  enviando = signal(false);
  pagina = signal(0);
  orden = signal<'fecha' | 'meGusta'>('fecha');
  readonly limite = 5;

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limite)));

  imagen: File | null = null;
  form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    mensaje: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service
      .listar({ orden: this.orden(), offset: this.pagina() * this.limite, limit: this.limite })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.modal.error('No se pudieron cargar las publicaciones', err.error?.message ?? 'Error de conexión');
        },
      });
  }

  cambiarOrden(valor: string) {
    this.orden.set(valor === 'meGusta' ? 'meGusta' : 'fecha');
    this.pagina.set(0);
    this.cargar();
  }

  irAPagina(n: number) {
    if (n < 0 || n >= this.totalPaginas()) return;
    this.pagina.set(n);
    this.cargar();
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (archivo && (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024)) {
      this.modal.error('Imagen no válida', 'Debe ser JPG, PNG o WebP y pesar como máximo 5 MB.');
      input.value = '';
      this.imagen = null;
      return;
    }
    this.imagen = archivo;
  }

  publicar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    datos.append('titulo', this.form.value.titulo ?? '');
    datos.append('mensaje', this.form.value.mensaje ?? '');
    if (this.imagen) datos.append('imagen', this.imagen);

    this.enviando.set(true);
    this.service.crear(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.form.reset();
        this.imagen = null;
        const input = this.archivoInput()?.nativeElement;
        if (input) input.value = '';
        this.orden.set('fecha');
        this.pagina.set(0);
        this.cargar();
        this.modal.exito('¡Publicado!', 'Tu publicación se creó correctamente.');
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo publicar', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  alternarMeGusta(pub: Publicacion) {
    const yaDio = pub.meGusta.includes(this.usuario._id);
    const peticion = yaDio ? this.service.quitarMeGusta(pub._id) : this.service.darMeGusta(pub._id);
    peticion.subscribe({
      next: () => {
        this.items.update((lista) => {
          const actualizada = lista.map((p) =>
            p._id !== pub._id
              ? p
              : {
                  ...p,
                  meGusta: yaDio
                    ? p.meGusta.filter((id) => id !== this.usuario._id)
                    : [...p.meGusta, this.usuario._id],
                },
          );

          if (this.orden() === 'meGusta') {
            return [...actualizada].sort((a, b) => b.meGusta.length - a.meGusta.length);
          }
          return actualizada;
        });
      },
      error: (err) => this.modal.error('No se pudo actualizar el me gusta', err.error?.message ?? 'Error de conexión'),
    });
  }

  eliminar(pub: Publicacion) {
    this.service.eliminar(pub._id).subscribe({
      next: () => {
        if (this.items().length === 1 && this.pagina() > 0) this.pagina.update((p) => p - 1);
        this.cargar();
      },
      error: (err) => this.modal.error('No se pudo eliminar', err.error?.message ?? 'Error de conexión'),
    });
  }
}