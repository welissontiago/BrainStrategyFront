import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  title = 'ProjetoConhecimento';

  ngAfterViewInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
    });
    window.addEventListener('load', () => AOS.refresh());
  }
}
