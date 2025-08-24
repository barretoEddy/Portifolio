import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Directive({
  selector: '[appParallax]',
  standalone: true
})
export class ParallaxDirective implements OnInit, OnDestroy {
  @Input() parallaxSpeed: number = 0.5;
  @Input() parallaxDirection: 'up' | 'down' | 'left' | 'right' = 'up';
  @Input() parallaxScale: number = 1;
  @Input() parallaxRotation: number = 0;
  @Input() parallaxBlur: number = 0;
  @Input() parallaxOpacity: boolean = false;
  @Input() parallaxStart: string = 'top bottom';
  @Input() parallaxEnd: string = 'bottom top';
  @Input() parallaxScrub: number | boolean = 1;

  private scrollTrigger?: ScrollTrigger;
  private timeline?: gsap.core.Timeline;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupParallax();
  }

  ngOnDestroy(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
    if (this.timeline) {
      this.timeline.kill();
    }
  }

  private setupParallax(): void {
    const element = this.elementRef.nativeElement;

    // Configura o elemento para ter transform-style preserve-3d
    this.renderer.setStyle(element, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(element, 'will-change', 'transform');

    // Cria timeline com ScrollTrigger
    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: this.parallaxStart,
        end: this.parallaxEnd,
        scrub: this.parallaxScrub,
        onUpdate: (self) => {
          this.updateParallax(self.progress);
        }
      }
    });

    // Adiciona animações baseadas nas propriedades
    this.addParallaxAnimations();
  }

  private addParallaxAnimations(): void {
    if (!this.timeline) return;

    const element = this.elementRef.nativeElement;
    const animations: any = {};

    // Animação de movimento
    if (this.parallaxSpeed !== 0) {
      const movement = this.calculateMovement();
      animations.y = movement.y;
      animations.x = movement.x;
    }

    // Animação de escala
    if (this.parallaxScale !== 1) {
      animations.scale = this.parallaxScale;
    }

    // Animação de rotação
    if (this.parallaxRotation !== 0) {
      animations.rotation = this.parallaxRotation;
    }

    // Animação de blur
    if (this.parallaxBlur !== 0) {
      animations.filter = `blur(${this.parallaxBlur}px)`;
    }

    // Animação de opacidade
    if (this.parallaxOpacity) {
      animations.opacity = 0;
    }

    // Aplica as animações
    if (Object.keys(animations).length > 0) {
      this.timeline.to(element, {
        ...animations,
        ease: 'none'
      });
    }
  }

  private calculateMovement(): { x: number; y: number } {
    const baseMovement = 100 * this.parallaxSpeed;

    switch (this.parallaxDirection) {
      case 'up':
        return { x: 0, y: -baseMovement };
      case 'down':
        return { x: 0, y: baseMovement };
      case 'left':
        return { x: -baseMovement, y: 0 };
      case 'right':
        return { x: baseMovement, y: 0 };
      default:
        return { x: 0, y: -baseMovement };
    }
  }

  private updateParallax(progress: number): void {
    // Método adicional para atualizações customizadas se necessário
    // Pode ser usado para efeitos mais complexos
  }
}
