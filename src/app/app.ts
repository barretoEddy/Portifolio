import { Component, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Importe de todos os componentes de seção
import { HeaderComponent } from './header/header.component'; //cabeçalho da pagina
import { HeroComponent } from './hero/hero.component'; //Parte que contem a animação de particulas da pagina inicial
import { CabinComponent } from './cabin/cabin.component'; //
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { PerceptionComponent } from './perception/perception.component';
import { ConclusionComponent } from './conclusion/conclusion.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, HeaderComponent, HeroComponent, CabinComponent,
    MaintenanceComponent, PerceptionComponent, ConclusionComponent, FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements AfterViewInit, OnDestroy {

  private ctx!: gsap.Context; // Usar o contexto do GSAP para limpeza

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // um pequeno atraso para garantir que o DOM está 100% pronto
    setTimeout(() => {

      const main = this.elementRef.nativeElement;

      // O gsap.context() agrupa todas as animações.
      // Tudo o que é criado aqui dentro pode ser revertido de uma só vez.
      this.ctx = gsap.context(() => {

        // --- Seção 1: Animação do "Sobre Mim" (Cabin) ---
        const cabinSection = main.querySelector('#cabin');
        if (cabinSection) this.setupCabinAnimation(cabinSection);

        // --- Seção 2: Animação dos "Serviços" (Maintenance) ---
        const maintenanceSection = main.querySelector('#maintenance');
        if (maintenanceSection) this.setupMaintenanceAnimation(maintenanceSection);

        // --- Seção 3: Animação dos "Projetos" (Perception) ---
        const perceptionSection = main.querySelector('#perception');
        if (perceptionSection) this.setupPerceptionAnimation(perceptionSection);

      }, main); // O 'main' aqui define o escopo do nosso contexto

    }, 100); //100ms de atraso para garantir que o DOM esteja pronto
  }

  // As funções abaixo permanecem quase iguais, mas agora operam dentro do contexto.

  private setupCabinAnimation(section: Element): void {
    const animatedTitle = section.querySelector('.animated-title');
    const animatedTexts = section.querySelectorAll('.animated-text');
    const skillsList = section.querySelector('.skills-list');
    const imageContainer = section.querySelector('.about-image');
    if (!animatedTitle || animatedTexts.length === 0) return;

    const splitTitle = new SplitText(animatedTitle, { type: 'chars' });

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        pin: true,
        scrub: 1,
        end: '+=1500',
      }
    })
    .from(splitTitle.chars, { opacity: 0, y: 20, stagger: 0.03, ease: 'power2.out' })
    .from([animatedTexts, skillsList], { opacity: 0, y: 30, stagger: 0.15, ease: 'power3.out' }, '-=0.5')
    .from(imageContainer, { opacity: 0, x: 50, ease: 'power3.out' }, '-=0.5');
  }

  private setupMaintenanceAnimation(section: Element): void {
    const title = section.querySelector('.section-title');
    const cards = section.querySelectorAll('.service-card');

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: 'top top',
        end: '+=1500',
        scrub: 1,
      }
    })
    .from(title, { opacity: 0, y: 50, ease: 'power2.out' })
    .from(cards, { opacity: 0, y: 50, stagger: 0.2, ease: 'power2.out' }, '-=0.25');
  }

  private setupPerceptionAnimation(section: Element): void {
    const title = section.querySelector('.section-title');
    const projectItems = gsap.utils.toArray(section.querySelectorAll('.project-item'));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        // pin: true,
        start: 'top 90%',
        end: `bottom bottom+=133px`,
        // markers: true,
        scrub: true,
      }
    });

    tl.from(title, { opacity: 0, y: 50, ease: 'power2.out' });

    projectItems.forEach((item, index) => {
      const image = (item as Element).querySelector('.project-image');
      const info = (item as Element).querySelector('.project-info');
      tl
        .from(image, { xPercent: (index % 2 === 0) ? -50 : 50, opacity: 0 }, "<")
        .from(info, { xPercent: (index % 2 === 0) ? 50 : -50, opacity: 0 }, "<0.2");
    });
  }

  ngOnDestroy(): void {
    // O revert() do contexto limpa tudo criado dentro dele (timelines, splittext, etc.)
    this.ctx?.revert();
  }
}
