import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, HostListener } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CommonModule } from '@angular/common';
import { ThreeDKeyboardNewService } from '../services/three-d-keyboard-new.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroTitle', { static: true, read: ElementRef })
  private heroTitleRef!: ElementRef<HTMLDivElement>;
  @ViewChild('heroSection', { static: true, read: ElementRef })
  private heroSectionRef!: ElementRef<HTMLDivElement>;

  private threeDService = inject(ThreeDKeyboardNewService);
  private keyboardBuilt = false;
  private tl: gsap.core.Timeline | null = null;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    // Testar diretamente sem scroll trigger
    console.log('🚀 ngAfterViewInit - iniciando teclado diretamente');
    this.buildKeyboard();

    // this.setupHeroAnimation();
  }

  private setupHeroAnimation(): void {
    const heroSection = this.heroSectionRef.nativeElement;
    const heroTitle = this.heroTitleRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    // Animação de entrada inicial do título (não depende do scroll)
    gsap.from(heroTitle, {
      opacity: 1,
      y: 50,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3
    });

    // A timeline principal controlada pelo ScrollTrigger
    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: '+=2500', // Duração do "pin"
        scrub: 1,      // Animação suave atrelada ao scroll
        pin: true,
        anticipatePin: 1,
      },
    });

    // 1. Título desaparece (fade out, move para cima, diminui)
    this.tl.to(heroTitle, {
      opacity: 0,
      y: -100,
      scale: 0.8,
      duration: 1, // Duração relativa dentro da timeline
      ease: 'power2.inOut',
    }, 0); // Inicia no começo da timeline

    // 2. Canvas aparece (fade in e escala)
    this.tl.fromTo(canvas,
      { display: 'none', opacity: 0, scale: 0.5 },
      {
        display: 'block',
        opacity: 1,
        scale: 1.0, // Reduzindo de 1.2 para 1.0 para não ultrapassar a div
        duration: 1.5, // Duração relativa
        ease: 'power3.out',
        onStart: () => {
          // Executar buildKeyboard de forma assíncrona sem bloquear GSAP
          this.buildKeyboard();
        },
      },
      0.5 // Inicia um pouco depois do título começar a sumir
    );
  }

  private async buildKeyboard(): Promise<void> {
    if (!this.keyboardBuilt) {
      await this.threeDService.createScene(this.canvasRef);
      this.keyboardBuilt = true;
    }
  }

  ngOnDestroy(): void {
    // Garante que a timeline e o ScrollTrigger sejam destruídos para evitar memory leaks
    if (this.tl) {
      this.tl.scrollTrigger?.kill();
      this.tl.kill();
    }
    this.threeDService.ngOnDestroy();
  }

  @HostListener('window:resize')
  onResize() {
    this.threeDService.resize();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.threeDService.updateMousePosition(event);
  }
}
