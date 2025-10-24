import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Gradient } from './gradient.animation';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-gradient',
  imports: [HeaderComponent],
  templateUrl: './gradient.component.html',
  styleUrl: './gradient.component.css',
})
export class GradientComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gradientCanvas')
  gradientCanvas!: ElementRef<HTMLCanvasElement>;
  private gradient: Gradient;

  constructor() {
    this.gradient = new Gradient();
  }

  ngAfterViewInit(): void {
    if (this.gradientCanvas && this.gradientCanvas.nativeElement) {
      this.gradient.initGradient(this.gradientCanvas.nativeElement);
    } else {
      console.error('Elemento canvas do gradiente não foi encontrado!');
    }
  }

  ngOnDestroy(): void {
    if (this.gradient) {
      this.gradient.disconnect();
    }
  }
}
