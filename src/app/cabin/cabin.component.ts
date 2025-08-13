import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabin.component.html',
  styleUrl: './cabin.component.css'
})
export class CabinComponent implements AfterViewInit, OnDestroy {

  private splitTitle?: SplitText;
  private splitParagraphs: SplitText[] = [];
  private mainTimeline?: gsap.core.Timeline;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initAnimations();
    }, 100);
  }

  private initAnimations(): void {
    const componentElement = this.elementRef.nativeElement;
    // MUDANÇA: Pegamos a seção pai para fazer o pin
    const section = componentElement.closest('section');
    const animatedTitle = componentElement.querySelector('.animated-title');
    const animatedTexts = componentElement.querySelectorAll('.animated-text');
    const skillsList = componentElement.querySelector('.skills-list');
    const imageContainer = componentElement.querySelector('.about-image');

    if (!section || !animatedTitle || animatedTexts.length === 0) return;

    // Divisão do Texto (permanece igual)
    this.splitTitle = new SplitText(animatedTitle, { type: 'chars' });
    animatedTexts.forEach((p: HTMLElement) => {
      this.splitParagraphs.push(new SplitText(p, { type: 'lines' }));
    });

    // CRIAÇÃO DA TIMELINE COM PINNING
    this.mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: section, // O trigger agora é a seção inteira
        start: '-=300 top',   // A animação começa quando o topo da seção atinge o topo da janela

        // --- MUDANÇAS PRINCIPAIS AQUI ---
        // pin: true,          // 1. "Pina" a seção na tela
        scrub: 1,           // 2. Conecta a animação ao scroll (1s de suavização)
        end: '+=400',      // 3. Define um espaço de 2000px de scroll para a animação acontecer
        // toggleActions foi removido pois `scrub` o substitui.
        markers: true,   // Descomente para ver os marcadores de debug
      }
    });

    // Adição dos Passos de Animação (a lógica aqui é a mesma, mas o comportamento será diferente)
    this.mainTimeline
      .from(this.splitTitle.chars, {
        opacity: 0,
        y: 20,
        stagger: 0.05, // Aumentei um pouco o stagger para ficar melhor com o scrub
        ease: 'power2.out'
      })
      .from(this.splitParagraphs.flatMap(s => s.lines), {
        opacity: 0,
        y: 30,
        stagger: 0.1, // Aumentei um pouco o stagger
        ease: 'power3.out'
      }, '-=0.5') // O offset relativo ainda funciona
      .from([skillsList, imageContainer], {
        opacity: 0,
        y: 50,
        ease: 'power3.out',
        stagger: 0.3
      }, '-=0.5');
  }

  ngOnDestroy(): void {
    this.splitTitle?.revert();
    this.splitParagraphs.forEach(s => s.revert());
    this.mainTimeline?.kill();
  }
}
