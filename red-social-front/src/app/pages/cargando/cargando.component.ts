import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { SesionService } from '../../services/sesion.service';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-cargando',
  standalone: true,
  templateUrl: './cargando.component.html',
})
export class CargandoComponent implements OnInit {
  private auth = inject(AuthService);
  private usuarios = inject(UsuariosService);
  private sesion = inject(SesionService);
  private modal = inject(ModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }

    this.auth.autorizar().subscribe({
      next: (res) => {
        this.usuarios.guardar(res.usuario);
        this.sesion.iniciar();
        const volver = this.route.snapshot.queryParamMap.get('volver');
        this.router.navigateByUrl(volver && volver.startsWith('/') ? volver : '/publicaciones');
      },
      error: () => {
        this.sesion.cerrarSesion();
        this.router.navigate(['/login']);
        this.modal.error('Sin conexión', 'No se pudo conectar con el servidor.');
      },
    });
  }
}