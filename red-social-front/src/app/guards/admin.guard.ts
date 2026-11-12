import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const usuarios = inject(UsuariosService);

  if (usuarios.usuario()?.perfil === 'administrador') return true;
  return router.createUrlTree(['/publicaciones']);
};