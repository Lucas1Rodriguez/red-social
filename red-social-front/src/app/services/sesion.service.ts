import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ModalService } from './modal.service';
import { UsuariosService } from './usuarios.service';

const AVISO_ANTES = 30 * 1000;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private usuarios = inject(UsuariosService);
  private router = inject(Router);

  validada = false;

  private aviso?: ReturnType<typeof setTimeout>;
  private vencimiento?: ReturnType<typeof setTimeout>;

  private expiracion(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const recibido = Number(localStorage.getItem('token_recibido_en'));
      if (recibido) return recibido + (payload.exp - payload.iat) * 1000;
      return payload.exp * 1000;
    } catch {
      return null;
    }
  }

  iniciar() {
    this.detener();
    this.validada = true;
    const exp = this.expiracion();
    if (!exp) return;
    const restante = exp - Date.now();
    this.aviso = setTimeout(() => this.avisar(), Math.max(restante - AVISO_ANTES, 0));
    this.vencimiento = setTimeout(() => this.cerrarPorVencimiento(), Math.max(restante, 0));
  }

  detener() {
    clearTimeout(this.aviso);
    clearTimeout(this.vencimiento);
  }

  cerrarSesion() {
    this.detener();
    this.validada = false;
    localStorage.removeItem('token');
    this.usuarios.limpiar();
  }

  private avisar() {
    this.modal.confirmar('Tu sesión está por vencer', 'Te quedan 30 segundos de sesión. ¿Querés extenderla?', {
      aceptar: 'Extender sesión',
      cancelar: 'No, gracias',
      onAceptar: () => this.extender(),
    });
  }

  private extender() {
    this.auth.refrescar().subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.iniciar();
        this.modal.exito('Sesión extendida', 'Tu sesión se extendió 15 minutos más.');
      },
    });
  }

  private cerrarPorVencimiento() {
    this.cerrarSesion();
    this.router.navigate(['/login']);
    this.modal.info('Sesión vencida', 'Tu sesión venció. Iniciá sesión de nuevo.');
  }
}