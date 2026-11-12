import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../config';

export interface PubPorUsuario { usuario: string; cantidad: number; }
export interface ComentariosPorDia { total: number; items: { fecha: string; cantidad: number }[]; }
export interface ComPorPublicacion { publicacion: string; cantidad: number; }

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private http = inject(HttpClient);
  private url = `${API_URL}/estadisticas`;

  private params(desde: string, hasta: string) {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }

  publicacionesPorUsuario(desde: string, hasta: string) {
    return this.http.get<PubPorUsuario[]>(`${this.url}/publicaciones-por-usuario`, { params: this.params(desde, hasta) });
  }

  comentarios(desde: string, hasta: string) {
    return this.http.get<ComentariosPorDia>(`${this.url}/comentarios`, { params: this.params(desde, hasta) });
  }

  comentariosPorPublicacion(desde: string, hasta: string) {
    return this.http.get<ComPorPublicacion[]>(`${this.url}/comentarios-por-publicacion`, { params: this.params(desde, hasta) });
  }
}