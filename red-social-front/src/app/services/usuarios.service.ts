import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);

  usuario = signal<any>(JSON.parse(localStorage.getItem('usuario') ?? 'null'));

  guardar(u: any) {
    localStorage.setItem('usuario', JSON.stringify(u));
    this.usuario.set(u);
  }

  limpiar() {
    localStorage.removeItem('usuario');
    this.usuario.set(null);
  }

  actualizarPerfil(datos: FormData) {
    return this.http.put<any>(`${API_URL}/usuarios/perfil`, datos);
  }

  listar() {
    return this.http.get<any[]>(`${API_URL}/usuarios`);
  }

  crear(datos: FormData) {
    return this.http.post<any>(`${API_URL}/usuarios`, datos);
  }

  deshabilitar(id: string) {
    return this.http.delete<any>(`${API_URL}/usuarios/${id}`);
  }

  habilitar(id: string) {
    return this.http.post<any>(`${API_URL}/usuarios/${id}/alta`, {});
  }
}