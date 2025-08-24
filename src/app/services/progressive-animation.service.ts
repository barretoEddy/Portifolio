import { Injectable, ElementRef, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

@Injectable({
  providedIn: 'root'
})
export class ProgressiveAnimationService {
  private timelines: Map<string, gsap.core.Timeline> = new Map();
  private scrollTriggers: Map<string, ScrollTrigger> = new Map();

  constructor(private ngZone: NgZone) {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
  }

  /**
   * Cria uma animação progressiva baseada em scroll
   * @param trigger - Elemento que dispara a animação
   * @param animationId - ID único para a animação
   * @param config - Configuração da animação
   */
  createProgressiveAnimation(
    trigger: ElementRef<HTMLElement>,
    animationId: string,
    config: {
      start?: string;
      end?: string;
      scrub?: number | boolean;
      pin?: boolean;
      pinSpacing?: boolean;
      markers?: boolean;
      onUpdate?: (progress: number) => void;
      onEnter?: () => void;
      onLeave?: () => void;
      onEnterBack?: () => void;
      onLeaveBack?: () => void;
    } = {}
  ): gsap.core.Timeline {
    const defaultConfig = {
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 1,
      pin: false,
      pinSpacing: true,
      markers: false,
      ...config
    };

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: trigger.nativeElement,
        start: defaultConfig.start,
        end: defaultConfig.end,
        scrub: defaultConfig.scrub,
        pin: defaultConfig.pin,
        pinSpacing: defaultConfig.pinSpacing,
        markers: defaultConfig.markers,
        onUpdate: (self) => {
          if (defaultConfig.onUpdate) {
            this.ngZone.run(() => defaultConfig.onUpdate!(self.progress));
          }
        },
        onEnter: defaultConfig.onEnter,
        onLeave: defaultConfig.onLeave,
        onEnterBack: defaultConfig.onEnterBack,
        onLeaveBack: defaultConfig.onLeaveBack
      }
    });

    this.timelines.set(animationId, timeline);
    return timeline;
  }

  /**
   * Adiciona animação de texto com reveal progressivo
   */
  addTextRevealAnimation(
    timeline: gsap.core.Timeline,
    textElement: ElementRef<HTMLElement>,
    options: {
      duration?: number;
      stagger?: number;
      ease?: string;
      from?: 'left' | 'right' | 'top' | 'bottom';
      delay?: number;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      duration: 0.8,
      stagger: 0.05,
      ease: 'power3.out',
      from: 'bottom',
      delay: 0
    };

    const opts = { ...defaultOptions, ...options };
    const element = textElement.nativeElement;

    // Quebra o texto em caracteres se necessário
    if (!element.querySelector('.char')) {
      this.splitTextIntoChars(element);
    }

    const chars = element.querySelectorAll('.char');
    const fromProps = this.getFromProperties(opts.from);

    return timeline.from(chars, {
      ...fromProps,
      duration: opts.duration,
      stagger: opts.stagger,
      ease: opts.ease,
      delay: opts.delay
    });
  }

  /**
   * Adiciona animação de parallax
   */
  addParallaxAnimation(
    timeline: gsap.core.Timeline,
    element: ElementRef<HTMLElement>,
    options: {
      y?: number;
      x?: number;
      scale?: number;
      rotation?: number;
      ease?: string;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      y: -100,
      x: 0,
      scale: 1,
      rotation: 0,
      ease: 'none'
    };

    const opts = { ...defaultOptions, ...options };

    return timeline.to(element.nativeElement, {
      y: opts.y,
      x: opts.x,
      scale: opts.scale,
      rotation: opts.rotation,
      ease: opts.ease
    });
  }

  /**
   * Adiciona animação de fade com escala
   */
  addFadeScaleAnimation(
    timeline: gsap.core.Timeline,
    element: ElementRef<HTMLElement>,
    options: {
      duration?: number;
      ease?: string;
      scale?: number;
      delay?: number;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      duration: 0.6,
      ease: 'power3.out',
      scale: 0.8,
      delay: 0
    };

    const opts = { ...defaultOptions, ...options };

    return timeline.from(element.nativeElement, {
      opacity: 0,
      scale: opts.scale,
      duration: opts.duration,
      ease: opts.ease,
      delay: opts.delay
    });
  }

  /**
   * Adiciona animação de entrada com stagger
   */
  addStaggerAnimation(
    timeline: gsap.core.Timeline,
    elements: ElementRef<HTMLElement>[],
    options: {
      duration?: number;
      stagger?: number;
      ease?: string;
      from?: 'left' | 'right' | 'top' | 'bottom';
      delay?: number;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      from: 'bottom',
      delay: 0
    };

    const opts = { ...defaultOptions, ...options };
    const fromProps = this.getFromProperties(opts.from);

    return timeline.from(
      elements.map(el => el.nativeElement),
      {
        ...fromProps,
        duration: opts.duration,
        stagger: opts.stagger,
        ease: opts.ease,
        delay: opts.delay
      }
    );
  }

  /**
   * Adiciona animação de rotação 3D
   */
  add3DRotationAnimation(
    timeline: gsap.core.Timeline,
    element: ElementRef<HTMLElement>,
    options: {
      rotationX?: number;
      rotationY?: number;
      rotationZ?: number;
      duration?: number;
      ease?: string;
      transformOrigin?: string;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      duration: 1,
      ease: 'power2.out',
      transformOrigin: 'center center'
    };

    const opts = { ...defaultOptions, ...options };

    return timeline.to(element.nativeElement, {
      rotationX: opts.rotationX,
      rotationY: opts.rotationY,
      rotationZ: opts.rotationZ,
      duration: opts.duration,
      ease: opts.ease,
      transformOrigin: opts.transformOrigin
    });
  }

  /**
   * Adiciona animação de blur progressivo
   */
  addBlurAnimation(
    timeline: gsap.core.Timeline,
    element: ElementRef<HTMLElement>,
    options: {
      blur?: number;
      duration?: number;
      ease?: string;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      blur: 10,
      duration: 0.5,
      ease: 'power2.out'
    };

    const opts = { ...defaultOptions, ...options };

    return timeline.to(element.nativeElement, {
      filter: `blur(${opts.blur}px)`,
      duration: opts.duration,
      ease: opts.ease
    });
  }

  /**
   * Adiciona animação de cor progressiva
   */
  addColorAnimation(
    timeline: gsap.core.Timeline,
    element: ElementRef<HTMLElement>,
    options: {
      color?: string;
      backgroundColor?: string;
      duration?: number;
      ease?: string;
    } = {}
  ): gsap.core.Timeline {
    const defaultOptions = {
      color: '#64ffda',
      backgroundColor: 'transparent',
      duration: 0.8,
      ease: 'power2.out'
    };

    const opts = { ...defaultOptions, ...options };

    return timeline.to(element.nativeElement, {
      color: opts.color,
      backgroundColor: opts.backgroundColor,
      duration: opts.duration,
      ease: opts.ease
    });
  }

  /**
   * Limpa uma animação específica
   */
  clearAnimation(animationId: string): void {
    const timeline = this.timelines.get(animationId);
    if (timeline) {
      timeline.kill();
      this.timelines.delete(animationId);
    }

    const scrollTrigger = this.scrollTriggers.get(animationId);
    if (scrollTrigger) {
      scrollTrigger.kill();
      this.scrollTriggers.delete(animationId);
    }
  }

  /**
   * Limpa todas as animações
   */
  clearAllAnimations(): void {
    this.timelines.forEach(timeline => timeline.kill());
    this.timelines.clear();

    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.scrollTriggers.clear();
  }

  /**
   * Atualiza animações no resize
   */
  refresh(): void {
    ScrollTrigger.refresh();
  }

  // Métodos auxiliares privados
  private splitTextIntoChars(element: HTMLElement): void {
    const text = element.textContent || '';
    element.innerHTML = '';

    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'char';
      element.appendChild(span);
    });
  }

  private getFromProperties(direction: string): any {
    switch (direction) {
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
