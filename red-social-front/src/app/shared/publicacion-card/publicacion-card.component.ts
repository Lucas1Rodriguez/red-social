import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion } from '../../services/publicaciones.service';
import { TiempoRelativoPipe } from '../../pipes/tiempo-relativo.pipe';
import { RecortarPipe } from '../../pipes/recortar.pipe';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [DatePipe, RouterLink, TiempoRelativoPipe, RecortarPipe],
  templateUrl: './publicacion-card.component.html',
})
export class PublicacionCardComponent {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() usuarioId = '';
  @Input() esAdmin = false;
  @Input() enDetalle = false;

  @Output() meGusta = new EventEmitter<Publicacion>();
  @Output() eliminar = new EventEmitter<Publicacion>();

  get yaDioMeGusta() {
    return this.publicacion.meGusta.includes(this.usuarioId);
  }

  get puedeEliminar() {
    return this.publicacion.autor._id === this.usuarioId || this.esAdmin;
  }
}