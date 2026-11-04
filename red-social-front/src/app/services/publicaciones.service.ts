import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../config';

export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen: string;
  autor: { _id: string; nombreUsuario: string; imagenPerfil: string };
  meGusta: string[];
  createdAt: string;
}

export interface ListadoPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);
  private url = `${API_URL}/publicaciones`;

  listar(opts: { orden: 'fecha' | 'meGusta'; offset: number; limit: number; autor?: string }) {
    let params = new HttpParams()
      .set('orden', opts.orden)
      .set('offset', opts.offset)
      .set('limit', opts.limit);
    if (opts.autor) params = params.set('autor', opts.autor);
    return this.http.get<ListadoPublicaciones>(this.url, { params });
  }

  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  darMeGusta(id: string) {
    return this.http.post<{ meGusta: number }>(`${this.url}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string) {
    return this.http.delete<{ meGusta: number }>(`${this.url}/${id}/me-gusta`);
  }
}