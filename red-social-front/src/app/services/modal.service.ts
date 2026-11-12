import { Injectable, signal } from '@angular/core';

export interface ModalData {
  tipo: 'exito' | 'error' | 'info';
  titulo: string;
  mensajes: string[];
  confirmacion?: {
    aceptar: string;
    cancelar: string;
    onAceptar: () => void;
    onCancelar?: () => void;
  };
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

  confirmar(titulo: string, mensajes: string | string[], confirmacion: NonNullable<ModalData['confirmacion']>) {
    this.modal.set({
      tipo: 'info',
      titulo,
      mensajes: Array.isArray(mensajes) ? mensajes : [mensajes],
      confirmacion,
    });
  }

  aceptarConfirmacion() {
    const c = this.modal()?.confirmacion;
    this.cerrar();
    c?.onAceptar();
  }

  cancelarConfirmacion() {
    const c = this.modal()?.confirmacion;
    this.cerrar();
    c?.onCancelar?.();
  }

  cerrar() { this.modal.set(null); }
}