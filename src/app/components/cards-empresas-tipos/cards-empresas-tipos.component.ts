import {
  Component,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-cards-empresas-tipos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards-empresas-tipos.component.html',
  styleUrls: ['./cards-empresas-tipos.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CardsEmpresasTiposComponent implements AfterViewInit {
  ngAfterViewInit() {
    const swiperEl = document.querySelector('swiper-container');

    if (swiperEl) {
      Object.assign(swiperEl, {
        slidesPerView: 2.7,
        spaceBetween: 40,
        grabCursor: true,
        centeredSlides: false,
        navigation: false,
        pagination: false,
        autoplay: false,
        breakpoints: {
          0: { slidesPerView: 1.4, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 25 },
          1200: { slidesPerView: 2.7, spaceBetween: 40 },
        },
      });

      swiperEl.initialize();
    }
  }
}
