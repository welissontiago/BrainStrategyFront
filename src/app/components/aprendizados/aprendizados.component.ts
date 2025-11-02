import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-aprendizados',
  imports: [MatIconModule, CommonModule],
  templateUrl: './aprendizados.component.html',
  styleUrl: './aprendizados.component.css',
})
export class AprendizadosComponent {
  @Input() aprendizado: any;
}
