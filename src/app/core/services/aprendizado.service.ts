import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  getHomeData(): Observable<HomeData> {
    return this.http.get<HomeData>(`${this.API_URL}/home/`);
  }

  createAprendizado(payload: AprendizadoPayload): Observable<any> {
    return this.http.post(`${this.API_URL}/learning-records/`, payload);
  }
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/categories/`);
  }
}
