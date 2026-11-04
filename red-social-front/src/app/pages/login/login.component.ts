import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private router = inject(Router);

  enviando = false;

  form = this.fb.group({
    identificador: ['', Validators.required],
    contrasenia: ['', Validators.required],
  });

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.auth.login(this.form.value as { identificador: string; contrasenia: string }).subscribe({
      next: (res) => {
        this.enviando = false;
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.enviando = false;
        const msg = err.error?.message ?? 'No se pudo conectar con el servidor';
        this.modal.error('No se pudo iniciar sesión', msg);
      },
    });
  }
}