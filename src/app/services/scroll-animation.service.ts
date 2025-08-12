import { Injectable, ElementRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollAnimationService {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersect, {
      root: null, // Observa em relação ao viewport
      rootMargin: '0px',
      threshold: 0.2 // A animação começa quando 20% do elemento está visível
    });
  }

  public observe(element: ElementRef): void {
    this.observer.observe(element.nativeElement);
  }

  public unobserve(element: ElementRef): void {
    this.observer.unobserve(element.nativeElement);
  }

  private handleIntersect(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // Deixa de observar após a animação
      }
    });
  }
}
