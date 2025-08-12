import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ScrollAnimationService } from '../services/scroll-animation.service';
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapReveal]',
  standalone: true,
})
export class GsapRevealDirective implements OnInit, OnDestroy {
  // Inputs para customizar a animação diretamente do HTML
  @Input() stagger: number = 0.1;
  @Input() y: number = 30;
  @Input() duration: number = 0.8;

  private observer: IntersectionObserver;
  private element: HTMLElement;

  constructor(
    private el: ElementRef,
    private scrollAnimationService: ScrollAnimationService
  ) {
    this.element = el.nativeElement;
    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
        root: null,
        rootMargin: '0px',
        threshold: 0.2,
    });
  }

  ngOnInit(): void {
    // Prepara o estado inicial dos elementos (invisível)
    gsap.set(this.element.children, { y: this.y, opacity: 0 });
    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer.unobserve(this.element);
  }

  private handleIntersect(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Quando o elemento está visível, dispara a animação GSAP
        gsap.to(this.element.children, {
          y: 0,
          opacity: 1,
          duration: this.duration,
          stagger: this.stagger,
          ease: 'power3.out',
        });
        observer.unobserve(entry.target); // Anima apenas uma vez
      }
    });
  }
}
