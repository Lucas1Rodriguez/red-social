import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { CargandoComponent } from './pages/cargando/cargando.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { PublicacionesComponent } from './pages/publicaciones/publicaciones.component';
import { PublicacionDetalleComponent } from './pages/publicacion-detalle/publicacion-detalle.component';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { DashboardUsuariosComponent } from './pages/dashboard-usuarios/dashboard-usuarios.component';
import { DashboardEstadisticasComponent } from './pages/dashboard-estadisticas/dashboard-estadisticas.component';

export const routes: Routes = [
  { path: '', component: CargandoComponent, pathMatch: 'full' },
  { path: 'cargando', component: CargandoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'publicaciones', component: PublicacionesComponent, canActivate: [authGuard] },
  { path: 'publicaciones/:id', component: PublicacionDetalleComponent, canActivate: [authGuard] },
  { path: 'mi-perfil', component: MiPerfilComponent, canActivate: [authGuard] },
  { path: 'dashboard/usuarios', component: DashboardUsuariosComponent, canActivate: [authGuard, adminGuard] },
  { path: 'dashboard/estadisticas', component: DashboardEstadisticasComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' },
];