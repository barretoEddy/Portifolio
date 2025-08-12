import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-conclusion',
  standalone: true,
  imports: [CommonModule], // Sem diretivas de animação aqui
  templateUrl: './conclusion.component.html',
  styleUrl: './conclusion.component.css'
})
export class ConclusionComponent implements AfterViewInit, OnDestroy {
  
  private tl?: gsap.core.Timeline;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // Atraso para garantir a renderização completa
    setTimeout(() => {
      this.initAnimation();
    }, 100);
  }

  private initAnimation(): void {
    const componentElement = this.elementRef.nativeElement;
    const content = componentElement.querySelector('.contact-content');
    
    // Pegamos todos os filhos diretos do container de conteúdo para animá-los
    const children = gsap.utils.toArray(content.children);

    if (!content) return;

    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: content,
        start: 'top 85%',
        toggleActions: 'play none none reverse', // Anima ao entrar, reverte ao sair por cima
      }
    });

    // Usamos .from() para animar os elementos DE um estado para o estado final (no CSS)
    this.tl.from(children, {
      y: 50,                   // Começam 50px abaixo da posição final
      opacity: 0,              // Começam invisíveis
      duration: 1,             // Animação de 1 segundo
      ease: 'power3.out',      // Efeito de desaceleração suave
      stagger: 0.2,            // Atraso de 0.2s entre a animação de cada elemento
    });
  }

  ngOnDestroy(): void {
    // Limpeza da timeline e do seu ScrollTrigger associado
    this.tl?.kill();
  }
}