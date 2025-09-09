import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.css']
})
export class MaintenanceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('maintenanceSection') maintenanceSection!: ElementRef<HTMLElement>;
  @ViewChild('maintenanceTitle') maintenanceTitle!: ElementRef<HTMLElement>;
  @ViewChildren('serviceCards') serviceCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('servicesGrid') servicesGrid!: ElementRef<HTMLElement>;

  private tl: gsap.core.Timeline | null = null;

  ngAfterViewInit(): void {
    // Garante que o plugin está registrado
    gsap.registerPlugin(ScrollTrigger);

    // Pequeno atraso para garantir que todos os elementos foram renderizados
    setTimeout(() => this.setupPinnedAnimation(), 0);
  }

  private setupPinnedAnimation(): void {
  // Preferir o elemento <section id="maintenance"> (pai do componente) como trigger/pin.
  const sectionEl = document.getElementById('maintenance') as HTMLElement | null;
  const section = sectionEl ?? this.maintenanceSection.nativeElement;
    const title = this.maintenanceTitle.nativeElement;
    const cards = this.serviceCards.map(ref => ref.nativeElement);

    // calcula dimensões necessárias antes de criar o ScrollTrigger
    const gridEl = this.servicesGrid.nativeElement;
    const visibleWidth = section.clientWidth;
    const shift = Math.max(0, gridEl.scrollWidth - visibleWidth);
    const cardsCount = Math.max(1, cards.length);
    const endDistance = Math.max(800, Math.ceil(shift) + window.innerHeight);

    // calcula o deslocamento inicial para centralizar o primeiro card na área visível
    let desiredStartX = 0;
    if (cards.length > 0) {
      const firstCard = cards[0];
      const firstOffset = firstCard.offsetLeft || 0; // posição do card dentro do grid
      const firstWidth = firstCard.offsetWidth || 0;
      desiredStartX = (visibleWidth - firstWidth) / 2 - firstOffset;
      // aplica a posição inicial imediatamente para evitar flicker
      gsap.set(gridEl, { x: desiredStartX });
    }

    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        // inicia quando o centro da seção encontra o centro da viewport — pin centralizado
        start: 'center center',
        end: `+=${endDistance}`,
        scrub: 1,
        pin: section,
        pinSpacing: true,
        markers: false,
        snap: cardsCount > 1 ? { snapTo: 1 / (cardsCount - 1), duration: 0.35, ease: 'power1.out' } : undefined,
      },
    });

    // Animação do título
    this.tl.from(title, {
      opacity: 0,
      y: 50,
      duration: 0.5
    });

    // Simples animação: desliza o grid inteiro da posição 0 até -shift;
    // o ScrollTrigger com scrub mapeia o progresso do scroll para esse tween
    if (shift > 0) {
      const endX = desiredStartX - shift;
      this.tl!.to(gridEl, {
        x: endX,
        ease: 'none',
      });
    }
  }

  ngOnDestroy(): void {
    // Limpa a timeline e o scrollTrigger para evitar memory leaks
    if (this.tl) {
      this.tl.scrollTrigger?.kill();
      this.tl.kill();
    }
  }
}
