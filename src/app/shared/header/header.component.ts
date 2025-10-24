import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Gradient } from '../../components/gradient/gradient.animation';

@Component({
  selector: 'app-header',
  imports: [MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
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
