import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [NavbarComponent, DatePipe],
  templateUrl: './mi-perfil.component.html',
})
export class MiPerfilComponent {
  usuario = JSON.parse(localStorage.getItem('usuario') ?? 'null');
}