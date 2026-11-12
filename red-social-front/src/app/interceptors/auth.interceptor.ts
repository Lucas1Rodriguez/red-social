import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { ModalService } from '../services/modal.service';
import { SesionService } from '../services/sesion.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const modal = inject(ModalService);

  const token = localStorage.getItem('token');
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err) => {
      const esFormularioAuth = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      const esArranque = req.url.includes('/auth/autorizar');

      if (err.status === 401 && !esFormularioAuth) {
        sesion.cerrarSesion();
        router.navigate(['/login']);
        if (!esArranque) {
          modal.info('Sesión vencida', 'Tu sesión venció o no es válida. Iniciá sesión de nuevo.');
        }
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};