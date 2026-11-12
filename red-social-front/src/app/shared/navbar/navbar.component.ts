import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UsuariosService } from '../../services/usuarios.service';
import { SesionService } from '../../services/sesion.service';
import { SoloAdminDirective } from '../../directivas/solo-admin.directive';
import { InicialesPipe } from '../../pipes/iniciales.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SoloAdminDirective, InicialesPipe],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private usuarios = inject(UsuariosService);
  private sesion = inject(SesionService);
  private router = inject(Router);
  usuario = this.usuarios.usuario;

  salir() {
    this.sesion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}