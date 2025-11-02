import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface VideoPayload {
  title: string;
  url: string;
}

export interface AprendizadoPayload {
  title: string;
  learning_type: string;
  reading_duration: string;
  summary: string;
  category: number;
  videos: VideoPayload[];
}

export interface HomeData {
  learning_records_pagination: any;
  insights: any;
  learning_records: any[];
}

@Injectable({
  providedIn: 'root',
})
export class AprendizadoService {
  private API_URL = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  getHomeData(): Observable<HomeData> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Nenhum token encontrado, a requisição pode falhar.');
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<HomeData>(`${this.API_URL}/home/`, { headers });
  }

  createAprendizado(payload: AprendizadoPayload): Observable<any> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Nenhum token encontrado, a requisição pode falhar.');
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.API_URL}/learning-records/`, payload, {
      headers,
    });
  }
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/categories/`);
  }
}
