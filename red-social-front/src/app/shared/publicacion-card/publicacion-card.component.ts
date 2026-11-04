import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Publicacion } from '../../services/publicaciones.service';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './publicacion-card.component.html',
})
export class PublicacionCardComponent {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() usuarioId = '';
  @Input() esAdmin = false;

  @Output() meGusta = new EventEmitter<Publicacion>();
  @Output() eliminar = new EventEmitter<Publicacion>();

  get yaDioMeGusta() {
    return this.publicacion.meGusta.includes(this.usuarioId);
  }

  get puedeEliminar() {
    return this.publicacion.autor._id === this.usuarioId || this.esAdmin;
  }
}