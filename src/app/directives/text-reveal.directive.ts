import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Directive({
  selector: '[appTextReveal]',
  standalone: true
})
export class TextRevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay: number = 0;
  @Input() revealStagger: number = 0.05;
  @Input() revealDuration: number = 0.8;
  @Input() revealEase: string = 'power3.out';
  @Input() revealFrom: 'left' | 'right' | 'top' | 'bottom' = 'bottom';
  @Input() revealThreshold: number = 0.8;
  @Input() revealOnce: boolean = true;

  private chars: HTMLElement[] = [];
  private scrollTrigger?: ScrollTrigger;
  private hasRevealed = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.prepareText();
    this.setupAnimation();
  }

  ngOnDestroy(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }

  private prepareText(): void {
    const element = this.elementRef.nativeElement;
    const text = element.textContent || '';

    // Limpa o conteúdo atual
    element.innerHTML = '';

    // Cria spans para cada caractere
    text.split('').forEach((char, index) => {
      const span = this.renderer.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'text-reveal-char';

      // Aplica estilos iniciais
      this.renderer.setStyle(span, 'display', 'inline-block');
      this.renderer.setStyle(span, 'opacity', '0');
      this.renderer.setStyle(span, 'transform', this.getInitialTransform());
      this.renderer.setStyle(span, 'transition', 'none');

      this.renderer.appendChild(element, span);
      this.chars.push(span);
    });
  }

  private setupAnimation(): void {
    const element = this.elementRef.nativeElement;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: `top ${this.revealThreshold * 100}%`,
      onEnter: () => {
        if (!this.hasRevealed || !this.revealOnce) {
          this.animateText();
          this.hasRevealed = true;
        }
      },
      onEnterBack: () => {
        if (!this.revealOnce) {
          this.reverseAnimation();
        }
      }
    });
  }

  private animateText(): void {
    const fromProps = this.getFromProperties();

    gsap.to(this.chars, {
      ...fromProps,
      duration: this.revealDuration,
      stagger: this.revealStagger,
      ease: this.revealEase,
      delay: this.revealDelay,
      onStart: () => {
        this.chars.forEach(char => {
          this.renderer.setStyle(char, 'transition', 'none');
        });
      }
    });
  }

  private reverseAnimation(): void {
    const toProps = this.getFromProperties();

    gsap.to(this.chars, {
      ...toProps,
      duration: this.revealDuration * 0.5,
      stagger: this.revealStagger * 0.5,
      ease: 'power2.in'
    });
  }

  private getInitialTransform(): string {
    switch (this.revealFrom) {
      case 'left':
        return 'translateX(-100px)';
      case 'right':
        return 'translateX(100px)';
      case 'top':
        return 'translateY(-100px)';
      case 'bottom':
      default:
        return 'translateY(100px)';
    }
  }

  private getFromProperties(): any {
    switch (this.revealFrom) {
      case 'left':
        return { x: -100, opacity: 0 };
      case 'right':
        return { x: 100, opacity: 0 };
      case 'top':
        return { y: -100, opacity: 0 };
      case 'bottom':
      default:
        return { y: 100, opacity: 0 };
    }
  }
}
