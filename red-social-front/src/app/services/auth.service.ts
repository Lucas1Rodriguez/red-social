import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  registro(datos: FormData) {
    return this.http.post<any>(`${API_URL}/auth/registro`, datos);
  }

  login(datos: { identificador: string; contrasenia: string }) {
    return this.http.post<any>(`${API_URL}/auth/login`, datos);
  }
}