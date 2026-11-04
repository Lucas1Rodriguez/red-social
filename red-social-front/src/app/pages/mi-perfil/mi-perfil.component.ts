import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { PublicacionCardComponent } from '../../shared/publicacion-card/publicacion-card.component';
import { Publicacion, PublicacionesService } from '../../services/publicaciones.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [NavbarComponent, PublicacionCardComponent, DatePipe],
  templateUrl: './mi-perfil.component.html',
})
export class MiPerfilComponent implements OnInit {
  private service = inject(PublicacionesService);
  private modal = inject(ModalService);

  usuario = JSON.parse(localStorage.getItem('usuario') ?? 'null');
  items = signal<Publicacion[]>([]);
  cargando = signal(false);

  ngOnInit() {
    if (this.usuario) this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service
      .listar({ orden: 'fecha', offset: 0, limit: 3, autor: this.usuario._id })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.modal.error('No se pudieron cargar tus publicaciones', err.error?.message ?? 'Error de conexión');
        },
      });
  }

  alternarMeGusta(pub: Publicacion) {
    const yaDio = pub.meGusta.includes(this.usuario._id);
    const peticion = yaDio ? this.service.quitarMeGusta(pub._id) : this.service.darMeGusta(pub._id);
    peticion.subscribe({
      next: () => {
        this.items.update((lista) =>
          lista.map((p) =>
            p._id !== pub._id
              ? p
              : {
                  ...p,
                  meGusta: yaDio
                    ? p.meGusta.filter((id) => id !== this.usuario._id)
                    : [...p.meGusta, this.usuario._id],
                },
          ),
        );
      },
      error: (err) => this.modal.error('No se pudo actualizar el me gusta', err.error?.message ?? 'Error de conexión'),
    });
  }

  eliminar(pub: Publicacion) {
    this.service.eliminar(pub._id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.modal.error('No se pudo eliminar', err.error?.message ?? 'Error de conexión'),
    });
  }
}