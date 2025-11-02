import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface person {
  email: string;
  username: string;
  password: string;
  is_superuser: boolean;
  name: string;
  department: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class createPersonService {
  private API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  createAprendizado(payload: person): Observable<any> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Nenhum token encontrado, a requisição pode falhar.');
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.API_URL}/users/collaborators/`, payload, {
      headers,
    });
  }
}
