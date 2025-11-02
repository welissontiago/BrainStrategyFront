import { Component, OnInit } from '@angular/core';
import { CardsComponent } from '../../components/cards/cards.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PesquisarComponent } from '../../components/pesquisar/pesquisar.component';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AprendizadosComponent } from '../../components/aprendizados/aprendizados.component';
import { Aprendizado } from '../../core/models/aprendizado.model';
import {
  AprendizadoPayload,
  AprendizadoService,
  HomeData,
  VideoPayload,
} from '../../core/services/aprendizado.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CardsComponent,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    RouterModule,
    PesquisarComponent,
    ReactiveFormsModule,
    AprendizadosComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  showModalAprendizado = false;
  showModalUsuario = false;

  addAprendizadoForm!: FormGroup;
  aprendizadosList: any[] = [];
  addUsuarioForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private aprendizadoService: AprendizadoService
  ) {}

  ngOnInit(): void {
    this.addAprendizadoForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['', Validators.required],
      categoria: ['', Validators.required],
      duracao: [
        '',
        [Validators.required, Validators.pattern(/^\d+:\d{2}:\d{2}$/)],
      ],
      resumo: ['', Validators.required],
      videos: this.fb.array([]),
    });

    this.addUsuarioForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],
      isAdmin: [false],
    });
  }

  loadAprendizados() {
    this.aprendizadoService.getHomeData().subscribe({
      next: (data: HomeData) => {
        this.aprendizadosList = data.learning_records;
      },
      error: (err) => {
        console.error('Erro ao buscar aprendizados:', err);
      },
    });
  }

  get videos(): FormArray {
    return this.addAprendizadoForm.get('videos') as FormArray;
  }

  addVideo() {
    const videoGroup = this.fb.group({
      titulo: ['', Validators.required],
      url: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i),
        ],
      ],
    });
    this.videos.push(videoGroup);
  }

  removeVideo(index: number) {
    this.videos.removeAt(index);
  }

  private mapTipo(tipo: string): string {
    const map: { [key: string]: string } = {
      Curso: 'Course',
      Workshop: 'Workshop',
      Treinamento: 'Workshop',
    };
    return map[tipo] || 'Article';
  }

  private mapCategoria(categoria: string): number {
    const map: { [key: string]: number } = {
      Gestão: 1,
      tecnologia: 2,
      softskill: 3,
    };
    return map[categoria];
  }

  salvarAprendizado() {
    if (this.addAprendizadoForm.invalid) {
      this.addAprendizadoForm.markAllAsTouched();
      return;
    }

    const formValue = this.addAprendizadoForm.value;
    const payload: AprendizadoPayload = {
      title: formValue.titulo,
      summary: formValue.resumo,
      learning_type: this.mapTipo(formValue.tipo),
      category: this.mapCategoria(formValue.categoria),
      reading_duration: formValue.duracao,
      videos: formValue.videos.map(
        (v: any) => ({ title: v.titulo, url: v.url } as VideoPayload)
      ),
    };

    this.aprendizadoService.createAprendizado(payload).subscribe({
      next: (response) => {
        console.log('Aprendizado salvo:', response);
        this.showModalAprendizado = false;
        this.addAprendizadoForm.reset();
        this.videos.clear();
        this.loadAprendizados();
      },
      error: (err) => {
        console.error('Erro ao salvar aprendizado:', err);
      },
    });
  }

  salvarUsuario() {
    if (this.addUsuarioForm.invalid) {
      this.addUsuarioForm.markAllAsTouched();
      return;
    }

    console.log('Usuário cadastrado:', this.addUsuarioForm.value);
    this.showModalUsuario = false;
  }
}
