import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroSection', { static: true, read: ElementRef })
  private heroSectionRef!: ElementRef<HTMLDivElement>;

  @ViewChild('splineViewer', { static: false, read: ElementRef })
  private splineViewerRef!: ElementRef;

  private tl: gsap.core.Timeline | null = null;
  private splineLoaded = false;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    // Inicia animações dos textos imediatamente
    this.setupTextAnimations();

    // Configura observador para detectar quando Spline carrega
    this.setupSplineObserver();
  }

  private setupTextAnimations(): void {
    // Animar apenas o título que existe no DOM
    gsap.fromTo('.hero-title',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
    );

    // Remover animação de .hero-description pois não existe no HTML
    // Se precisar adicionar uma descrição futuramente, adicione também no HTML
  }

  private setupSplineObserver(): void {
    const observer = new MutationObserver(() => {
      const splineElement = document.querySelector('spline-viewer');
      if (splineElement && !this.splineLoaded) {
        this.splineLoaded = true;
        this.setupSplineAnimations();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Fallback após 3 segundos
    setTimeout(() => {
      if (!this.splineLoaded) {
        this.setupSplineAnimations();
        observer.disconnect();
      }
    }, 3000);
  }

  private setupSplineAnimations(): void {
    gsap.fromTo('.spline-keyboard',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out' }
    );

    this.setupScrollAnimations();
  }

  private setupScrollAnimations(): void {
    const heroSection = this.heroSectionRef.nativeElement;

    // ScrollTrigger para parallax suave
    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: '+=100vh',
        scrub: true,
        pin: false
      }
    });

    this.tl.to('.hero-content', {
      y: -100,
      opacity: 0.3,
      duration: 1,
      ease: 'none'
    });

    this.tl.to('.spline-keyboard', {
      y: -50,
      scale: 1.1,
      duration: 1,
      ease: 'none'
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.tl) {
      this.tl.scrollTrigger?.kill();
      this.tl.kill();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}
