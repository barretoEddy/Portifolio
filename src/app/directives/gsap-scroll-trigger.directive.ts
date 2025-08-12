import { Directive, ElementRef, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Directive({
  selector: '[appGsapScrollTrigger]',
  standalone: true,
})
export class GsapScrollTriggerDirective implements AfterViewInit, OnDestroy {
  @Input() stagger: number = 0.1;
  @Input() y: number = 50;
  @Input() x: number = 0;
  @Input() duration: number = 1;
  @Input() start: string = 'top 80%'; // Quando o topo do elemento atinge 80% da altura da tela
  @Input() end: string = 'bottom 20%';
  @Input() scrub: boolean | number = false;
  @Input() toggleActions: string = 'play none none none';

  private timeline?: gsap.core.Timeline;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.initAnimation();
  }

  ngOnDestroy(): void {
    // Garante que a animação e o ScrollTrigger sejam limpos para evitar memory leaks
    this.timeline?.kill();
    ScrollTrigger.getById(this.el.nativeElement.id)?.kill();
  }

  private initAnimation(): void {
    const children = Array.from((this.el.nativeElement as HTMLElement).children);

    this.timeline = gsap.timeline({
      scrollTrigger: {
        id: this.el.nativeElement.id || `gsap-st-${Date.now()}`, // ID para limpeza
        trigger: this.el.nativeElement,
        start: this.start,
        end: this.end,
        scrub: this.scrub,
        toggleActions: this.toggleActions,
      },
    });

    // Anima cada elemento filho do container que tem a diretiva
    this.timeline.from(children, {
      y: this.y,
      x: this.x,
      opacity: 0,
      duration: this.duration,
      stagger: this.stagger,
      ease: 'power3.out',
    });
  }
}
