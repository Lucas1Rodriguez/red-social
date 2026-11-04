import { Injectable, signal } from '@angular/core';

export interface ModalData {
  tipo: 'exito' | 'error' | 'info';
  titulo: string;
  mensajes: string[];
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  modal = signal<ModalData | null>(null);

  private abrir(tipo: ModalData['tipo'], titulo: string, mensajes: string | string[]) {
    this.modal.set({ tipo, titulo, mensajes: Array.isArray(mensajes) ? mensajes : [mensajes] });
  }

  exito(titulo: string, mensajes: string | string[]) { this.abrir('exito', titulo, mensajes); }
  error(titulo: string, mensajes: string | string[]) { this.abrir('error', titulo, mensajes); }
  info(titulo: string, mensajes: string | string[]) { this.abrir('info', titulo, mensajes); }
  cerrar() { this.modal.set(null); }
}