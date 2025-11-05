import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-tela-exemplo-curso',
  imports: [CommonModule, RouterModule, MatIconModule, MatTabsModule],
  templateUrl: './tela-exemplo-curso.component.html',
  styleUrl: './tela-exemplo-curso.component.css',
})
export class TelaExemploCursoComponent {}
