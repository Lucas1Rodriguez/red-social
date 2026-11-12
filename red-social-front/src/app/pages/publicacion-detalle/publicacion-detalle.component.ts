import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { PublicacionCardComponent } from '../../shared/publicacion-card/publicacion-card.component';
import { Comentario, Publicacion, PublicacionesService } from '../../services/publicaciones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ModalService } from '../../services/modal.service';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { ResaltarDirective } from '../../directivas/resaltar.directive';
import { AutoEnfocarDirective } from '../../directivas/auto-enfocar.directive';

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [NavbarComponent, PublicacionCardComponent, ReactiveFormsModule, DatePipe, RouterLink, TiempoRelativoPipe, ResaltarDirective, AutoEnfocarDirective],
  templateUrl: './publicacion-detalle.component.html',
})
export class PublicacionDetalleComponent implements OnInit {
  private service = inject(PublicacionesService);
  private usuarios = inject(UsuariosService);
  private modal = inject(ModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  usuario = this.usuarios.usuario;
  id = this.route.snapshot.paramMap.get('id')!;
  readonly limite = 5;

  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);

  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  hayMas = computed(() => this.comentarios().length < this.totalComentarios());

  enviando = signal(false);
  editandoId = signal<string | null>(null);
  guardandoEdicion = signal(false);

  comentario = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] });
  edicion = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] });

  ngOnInit() {
    this.cargarPublicacion();
    this.cargarComentarios();
  }

  cargarPublicacion() {
    this.service.obtener(this.id).subscribe({
      next: (pub) => {
        this.publicacion.set(pub);
        this.cargando.set(false);
      },
      error: (err) => {
        this.modal.error('No se pudo cargar la publicación', err.error?.message ?? 'Error de conexión');
        this.router.navigate(['/publicaciones']);
      },
    });
  }

  cargarComentarios() {
    this.cargandoComentarios.set(true);
    this.service.listarComentarios(this.id, this.comentarios().length, this.limite).subscribe({
      next: (res) => {
        this.comentarios.update((lista) => [...lista, ...res.items]);
        this.totalComentarios.set(res.total);
        this.cargandoComentarios.set(false);
      },
      error: (err) => {
        this.cargandoComentarios.set(false);
        this.modal.error('No se pudieron cargar los comentarios', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  comentar() {
    if (this.comentario.invalid || !this.comentario.value.trim()) {
      this.comentario.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.service.comentar(this.id, this.comentario.value).subscribe({
      next: () => {
        this.enviando.set(false);
        this.comentario.reset('');
        this.refrescarComentarios(1);
      },
      error: (err) => {
        this.enviando.set(false);
        this.modal.error('No se pudo comentar', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  esMio(c: Comentario) {
    return c.autor._id === this.usuario()?._id;
  }

  empezarEdicion(c: Comentario) {
    this.editandoId.set(c._id);
    this.edicion.setValue(c.mensaje);
  }

  cancelarEdicion() {
    this.editandoId.set(null);
  }

  guardarEdicion(c: Comentario) {
    if (this.edicion.invalid || !this.edicion.value.trim()) {
      this.edicion.markAsTouched();
      return;
    }
    this.guardandoEdicion.set(true);
    this.service.editarComentario(this.id, c._id, this.edicion.value).subscribe({
      next: (actualizado) => {
        this.guardandoEdicion.set(false);
        this.comentarios.update((lista) => lista.map((x) => (x._id === c._id ? actualizado : x)));
        this.editandoId.set(null);
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.modal.error('No se pudo editar el comentario', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  alternarMeGusta() {
    const pub = this.publicacion();
    if (!pub) return;
    const miId = this.usuario()._id;
    const yaDio = pub.meGusta.includes(miId);
    const peticion = yaDio ? this.service.quitarMeGusta(pub._id) : this.service.darMeGusta(pub._id);
    peticion.subscribe({
      next: () =>
        this.publicacion.set({
          ...pub,
          meGusta: yaDio ? pub.meGusta.filter((x) => x !== miId) : [...pub.meGusta, miId],
        }),
      error: (err) => this.modal.error('No se pudo actualizar el me gusta', err.error?.message ?? 'Error de conexión'),
    });
  }

  eliminar() {
    this.service.eliminar(this.id).subscribe({
      next: () => this.router.navigate(['/publicaciones']),
      error: (err) => this.modal.error('No se pudo eliminar', err.error?.message ?? 'Error de conexión'),
    });
  }

  puedeEliminarComentario(c: Comentario) {
    return this.esMio(c) || this.usuario()?.perfil === 'administrador';
  }

  eliminarComentario(c: Comentario) {
    this.modal.confirmar('Eliminar comentario', '¿Seguro que querés eliminar este comentario?', {
      aceptar: 'Eliminar',
      cancelar: 'Cancelar',
      onAceptar: () => {
        this.service.eliminarComentario(this.id, c._id).subscribe({
          next: () => this.refrescarComentarios(),
          error: (err) =>
            this.modal.error('No se pudo eliminar el comentario', err.error?.message ?? 'Error de conexión'),
        });
      },
    });
  }

  private refrescarComentarios(extra = 0) {
    const cantidad = Math.min(Math.max(this.comentarios().length + extra, this.limite), 50);
    this.service.listarComentarios(this.id, 0, cantidad).subscribe({
      next: (res) => {
        this.comentarios.set(res.items);
        this.totalComentarios.set(res.total);
      },
      error: (err) =>
        this.modal.error('No se pudieron cargar los comentarios', err.error?.message ?? 'Error de conexión'),
    });
  }
}