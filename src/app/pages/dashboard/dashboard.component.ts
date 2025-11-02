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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  showModalAprendizado = false;
  showModalUsuario = false;

  addAprendizadoForm!: FormGroup;
  addUsuarioForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.addAprendizadoForm = this.fb.group({
      titulo: ['', Validators.required],
      tipo: ['', Validators.required],
      colaborador: ['', Validators.required],
      categoria: ['', Validators.required],
      dataConclusao: ['', Validators.required],
      duracao: ['', Validators.required],
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

  get videos(): FormArray<FormGroup> {
    return this.addAprendizadoForm.get('videos') as FormArray<FormGroup>;
  }

  addVideo() {
    const videoGroup = this.fb.group({
      titulo: ['', Validators.required],
      arquivo: [null, Validators.required],
      preview: [''],
    });
    this.videos.push(videoGroup);
  }

  removeVideo(index: number) {
    this.videos.removeAt(index);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileDropped(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.setVideoFile(index, file);
    }
  }

  onFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.setVideoFile(index, file);
    }
  }

  private setVideoFile(index: number, file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.videos.at(index).patchValue({
        arquivo: file,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  salvarAprendizado() {
    if (this.addAprendizadoForm.invalid) {
      this.addAprendizadoForm.markAllAsTouched();
      return;
    }

    console.log('Aprendizado salvo:', this.addAprendizadoForm.value);
    this.showModalAprendizado = false;
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
