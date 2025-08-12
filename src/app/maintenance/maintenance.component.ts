// src/app/maintenance/maintenance.component.ts (Atualizado)
import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css'
})
export class MaintenanceComponent implements AfterViewInit, OnDestroy {

  private tl?: gsap.core.Timeline;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    const componentElement = this.elementRef.nativeElement;
    // O elemento que dispara a animação agora é a própria seção
    const section = componentElement.closest('section');

    if (!section) {
      console.error('Elemento <section> pai não encontrado.');
      return;
    }

    const title = componentElement.querySelector('.section-title');
    const cards = componentElement.querySelectorAll('.service-card');

    gsap.set([title, cards], { opacity: 0, y: 50 });

    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: section, // O trigger é a seção inteira
        pin: true,        //  O pin também é na seção inteira
        start: 'top top',
        end: '+=1000',
        scrub: 1,
        // markers: true, // Descomente para depurar
      }
    });

    this.tl
      .to(title, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.5
      })
      .to(cards, {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        duration: 0.5,
        stagger: 0.2
      }, '-=0.2');
  }

  ngOnDestroy(): void {
    // Limpa a timeline e o scrollTrigger quando o componente é destruído
    this.tl?.kill();
  }
}
