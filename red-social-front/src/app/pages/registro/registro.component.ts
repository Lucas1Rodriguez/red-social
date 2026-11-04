import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { max } from 'rxjs';
import { maxLength } from '@angular/forms/signals';

function contraseniasIguales(group: AbstractControl): ValidationErrors | null {
  const a = group.get('contrasenia')?.value;
  const b = group.get('repetirContrasenia')?.value;
  return a === b ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private router = inject(Router);

  imagen: File | null = null;
  enviando = false;
  preview: string | null = null;

  form = this.fb.group(
    {
      nombre: ['', Validators.required, Validators.maxLength(10)],
      apellido: ['', Validators.required, Validators.maxLength(10)],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', Validators.required, Validators.maxLength(20)],
      contrasenia: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
      ]],
      repetirContrasenia: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      descripcion: ['', Validators.maxLength(200)],
    },
    { validators: contraseniasIguales },
  );

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (archivo && !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.modal.error('Imagen no válida', 'La imagen debe ser JPG, PNG o WebP.');
      input.value = '';
      this.imagen = null;
      this.preview = null;
      return;
    }
    if (archivo && archivo.size > 5 * 1024 * 1024) {
      this.modal.error('Imagen muy pesada', 'La imagen no puede superar los 5 MB.');
      input.value = '';
      this.imagen = null;
      this.preview = null;
      return;
    }

    if (this.preview) URL.revokeObjectURL(this.preview);
    this.imagen = archivo;
    this.preview = archivo ? URL.createObjectURL(archivo) : null;
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => datos.append(k, (v as string) ?? ''));
    if (this.imagen) datos.append('imagenPerfil', this.imagen);

    this.enviando = true;
    this.auth.registro(datos).subscribe({
      next: (res) => {
        this.enviando = false;
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.modal.exito('¡Registro exitoso!', 'Tu cuenta fue creada correctamente.');
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.enviando = false;
        const msg = err.error?.message ?? 'No se pudo conectar con el servidor';
        this.modal.error('No se pudo registrar', msg);
      },
    });
  }
}