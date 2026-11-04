import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './publicaciones.component.html',
})
export class PublicacionesComponent {}