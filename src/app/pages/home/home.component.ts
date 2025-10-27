import { AfterViewInit, Component } from '@angular/core';
import { GradientComponent } from '../../components/gradient/gradient.component';
import AOS from 'aos';
import { CardHomeInfosComponent } from '../../components/card-home-infos/card-home-infos.component';
import { CardsEmpresasTiposComponent } from '../../components/cards-empresas-tipos/cards-empresas-tipos.component';
import { NossoTimeComponent } from '../../components/nosso-time/nosso-time.component';
import { ContatoComponent } from '../../components/contato/contato.component';

@Component({
  selector: 'app-home',
  imports: [
    GradientComponent,
    CardHomeInfosComponent,
    CardsEmpresasTiposComponent,
    NossoTimeComponent,
    ContatoComponent,
  ],
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
