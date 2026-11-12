import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const sesion = inject(SesionService);

  if (!localStorage.getItem('token')) return router.createUrlTree(['/login']);
  if (!sesion.validada) {
    return router.createUrlTree(['/cargando'], { queryParams: { volver: state.url } });
  }
  return true;
};