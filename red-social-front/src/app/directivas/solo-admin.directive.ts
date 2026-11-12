import { Directive, TemplateRef, ViewContainerRef, effect, inject, untracked } from '@angular/core';
import { UsuariosService } from '../services/usuarios.service';

@Directive({ selector: '[appSoloAdmin]', standalone: true })
export class SoloAdminDirective {
  private plantilla = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);
  private usuarios = inject(UsuariosService);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.usuarios.usuario()?.perfil === 'administrador';
      untracked(() => {
        if (esAdmin && !this.visible) {
          this.contenedor.createEmbeddedView(this.plantilla);
          this.visible = true;
        } else if (!esAdmin && this.visible) {
          this.contenedor.clear();
          this.visible = false;
        }
      });
    });
  }
}