import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { UsuariosService } from '../../services/usuarios.service';
import { ModalService } from '../../services/modal.service';
import { ResaltarDirective } from '../../directivas/resaltar.directive';
import { AutoEnfocarDirective } from '../../directivas/auto-enfocar.directive';
import { InicialesPipe } from '../../pipes/iniciales.pipe';

function contraseniasIguales(group: AbstractControl): ValidationErrors | null {
  return group.get('contrasenia')?.value === group.get('repetirContrasenia')?.value ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, DatePipe, ResaltarDirective, AutoEnfocarDirective, InicialesPipe],
  templateUrl: './dashboard-usuarios.component.html',
})
export class DashboardUsuariosComponent implements OnInit {
  private service = inject(UsuariosService);
  private modal = inject(ModalService);
  private fb = inject(FormBuilder);

  yo = this.service.usuario;
  usuarios = signal<any[]>([]);
  cargando = signal(false);

  creando = signal(false);
  guardando = signal(false);
  preview = signal<string | null>(null);
  imagen: File | null = null;

  form = this.fb.group(
    {
      nombre: ['', Validators.required, Validators.maxLength(10)],
      apellido: ['', Validators.required, Validators.maxLength(10)],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', Validators.required, Validators.maxLength(20)],
      contrasenia: ['', [ Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/), ]],
      repetirContrasenia: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      descripcion: ['', Validators.maxLength(200)],
      perfil: ['usuario', Validators.required],
    },
    { validators: contraseniasIguales },
  );

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.modal.error('No se pudo cargar el listado', err.error?.message ?? 'Error de conexión');
      },
    });
  }

  alternarEstado(u: any) {
    const deshabilitar = u.activo !== false;
    this.modal.confirmar(
      deshabilitar ? 'Deshabilitar usuario' : 'Habilitar usuario',
      deshabilitar
        ? `@${u.nombreUsuario} no va a poder ingresar a la aplicación. ¿Continuar?`
        : `@${u.nombreUsuario} va a poder volver a usar la aplicación. ¿Continuar?`,
      {
        aceptar: deshabilitar ? 'Deshabilitar' : 'Habilitar',
        cancelar: 'Cancelar',
        onAceptar: () => {
          const peticion = deshabilitar ? this.service.deshabilitar(u._id) : this.service.habilitar(u._id);
          peticion.subscribe({
            next: (actualizado) =>
              this.usuarios.update((lista) =>
                lista.map((x) => (x._id === u._id ? { ...x, activo: actualizado.activo } : x)),
              ),
            error: (err) => this.modal.error('No se pudo cambiar el estado', err.error?.message ?? 'Error de conexión'),
          });
        },
      },
    );
  }

  abrirAlta() {
    this.form.reset({ perfil: 'usuario' });
    this.imagen = null;
    this.preview.set(null);
    this.creando.set(true);
  }

  cerrarAlta() {
    this.creando.set(false);
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

  crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => datos.append(k, (v as string) ?? ''));
    if (this.imagen) datos.append('imagenPerfil', this.imagen);

    this.guardando.set(true);
    this.service.crear(datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.creando.set(false);
        this.cargar();
        this.modal.exito('Usuario creado', 'El usuario se creó correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.modal.error('No se pudo crear el usuario', err.error?.message ?? 'Error de conexión');
      },
    });
  }
}