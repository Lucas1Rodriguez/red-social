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

export interface Comentario {
  _id: string;
  mensaje: string;
  modificado: boolean;
  createdAt: string;
  autor: { _id: string; nombreUsuario: string; imagenPerfil: string };
}

export interface ListadoComentarios {
  items: Comentario[];
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

  obtener(id: string) {
  return this.http.get<Publicacion>(`${this.url}/${id}`);
}

  listarComentarios(id: string, offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<ListadoComentarios>(`${this.url}/${id}/comentarios`, { params });
  }

  comentar(id: string, mensaje: string) {
    return this.http.post<Comentario>(`${this.url}/${id}/comentarios`, { mensaje });
  }

  editarComentario(id: string, comentarioId: string, mensaje: string) {
    return this.http.put<Comentario>(`${this.url}/${id}/comentarios/${comentarioId}`, { mensaje });
  }

  eliminarComentario(id: string, comentarioId: string) {
    return this.http.delete<void>(`${this.url}/${id}/comentarios/${comentarioId}`);
  }
}