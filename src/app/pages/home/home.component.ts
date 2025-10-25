import { AfterViewInit, Component } from '@angular/core';
import { GradientComponent } from '../../components/gradient/gradient.component';
import AOS from 'aos';
import { CardHomeInfosComponent } from '../../components/card-home-infos/card-home-infos.component';

@Component({
  selector: 'app-home',
  imports: [GradientComponent, CardHomeInfosComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
    });
    setTimeout(() => AOS.refresh(), 500);
  }
}
