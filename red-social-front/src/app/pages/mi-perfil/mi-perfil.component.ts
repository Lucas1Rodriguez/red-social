import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { PublicacionCardComponent } from '../../shared/publicacion-card/publicacion-card.component';
import { Comentario, Publicacion, PublicacionesService } from '../../services/publicaciones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { forkJoin } from 'rxjs';
import { ModalService } from '../../services/modal.service';
import { AutoEnfocarDirective } from '../../directivas/auto-enfocar.directive';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [NavbarComponent, PublicacionCardComponent, DatePipe, ReactiveFormsModule, AutoEnfocarDirective],
  templateUrl: './mi-perfil.component.html',
})
export class MiPerfilComponent implements OnInit {
  private service = inject(PublicacionesService);
  private usuarios = inject(UsuariosService);
  private modal = inject(ModalService);
  private fb = inject(FormBuilder);

  usuario = this.usuarios.usuario;
  items = signal<Publicacion[]>([]);
  comentarios = signal<Record<string, { items: Comentario[]; total: number }>>({});
  cargando = signal(false);

  editando = signal(false);
  guardando = signal(false);
  preview = signal<string | null>(null);
  imagen: File | null = null;

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    fechaNacimiento: ['', Validators.required],
    descripcion: ['', Validators.maxLength(200)],
  });

  ngOnInit() {
    if (this.usuario()) this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service
      .listar({ orden: 'fecha', offset: 0, limit: 3, autor: this.usuario()._id })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.cargando.set(false);
          this.cargarComentarios(res.items);
        },
        error: (err) => {
          this.cargando.set(false);
          this.modal.error('No se pudieron cargar tus publicaciones', err.error?.message ?? 'Error de conexión');
        },
      });
  }

  abrirEdicion() {
    const u = this.usuario();
    this.form.reset({
      nombre: u.nombre,
      apellido: u.apellido,
      fechaNacimiento: (u.fechaNacimiento ?? '').substring(0, 10),
      descripcion: u.descripcion ?? '',
    });
    this.imagen = null;
    this.preview.set(null);
    this.editando.set(true);
  }

  cerrarEdicion() {
    this.editando.set(false);
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (archivo && (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024)) {
      this.modal.error('Imagen no válida', 'Debe ser JPG, PNG o WebP y pesar como máximo 5 MB.');
      input.value = '';
      return;
    }
    if (!archivo) return;
    const anterior = this.preview();
    if (anterior) URL.revokeObjectURL(anterior);
    this.imagen = archivo;
    this.preview.set(URL.createObjectURL(archivo));
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const datos = new FormData();
    datos.append('nombre', v.nombre ?? '');
    datos.append('apellido', v.apellido ?? '');
    datos.append('fechaNacimiento', v.fechaNacimiento ?? '');
    datos.append('descripcion', v.descripcion ?? '');
    if (this.imagen) datos.append('imagenPerfil', this.imagen);

    this.guardando.set(true);
    this.usuarios.actualizarPerfil(datos).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.usuarios.guardar(actualizado);
        this.editando.set(false);
        this.cargar();
        this.modal.exito('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.modal.error('No se pudo actualizar el perfil', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  alternarMeGusta(pub: Publicacion) {
    const id = this.usuario()._id;
    const yaDio = pub.meGusta.includes(id);
    const peticion = yaDio ? this.service.quitarMeGusta(pub._id) : this.service.darMeGusta(pub._id);
    peticion.subscribe({
      next: () => {
        this.items.update((lista) =>
          lista.map((p) =>
            p._id !== pub._id
              ? p
              : { ...p, meGusta: yaDio ? p.meGusta.filter((x) => x !== id) : [...p.meGusta, id] },
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

  private cargarComentarios(pubs: Publicacion[]) {
    if (pubs.length === 0) {
      this.comentarios.set({});
      return;
    }
    forkJoin(pubs.map((p) => this.service.listarComentarios(p._id, 0, 3))).subscribe({
      next: (resultados) => {
        const mapa: Record<string, { items: Comentario[]; total: number }> = {};
        pubs.forEach((p, i) => (mapa[p._id] = { items: resultados[i].items, total: resultados[i].total }));
        this.comentarios.set(mapa);
      },
      error: (err) =>
        this.modal.error('No se pudieron cargar los comentarios', err.error?.message ?? 'Error de conexión'),
    });
  }
}