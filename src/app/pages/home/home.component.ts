import { Component } from '@angular/core';
import { GradientComponent } from '../../components/gradient/gradient.component';

@Component({
  selector: 'app-home',
  imports: [GradientComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
