import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProgressiveAnimationService } from '../services/progressive-animation.service';
import { TextRevealDirective } from '../directives/text-reveal.directive';
import { ParallaxDirective } from '../directives/parallax.directive';

@Component({
  selector: 'app-conclusion',
  standalone: true,
  imports: [CommonModule, TextRevealDirective, ParallaxDirective],
  templateUrl: './conclusion.component.html',
  styleUrl: './conclusion.component.css'
})
export class ConclusionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('conclusionSection', { static: true, read: ElementRef })
  private conclusionSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('conclusionTitle', { static: true, read: ElementRef })
  private conclusionTitleRef!: ElementRef<HTMLHeadingElement>;
  @ViewChild('conclusionText', { static: true, read: ElementRef })
  private conclusionTextRef!: ElementRef<HTMLParagraphElement>;
  @ViewChild('conclusionButton', { static: true, read: ElementRef })
  private conclusionButtonRef!: ElementRef<HTMLAnchorElement>;

  private progressiveAnimationService = inject(ProgressiveAnimationService);
  private animationTimeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupConclusionAnimations();
  }

  private setupConclusionAnimations(): void {
    // Cria timeline principal para a seção conclusion
    this.animationTimeline = this.progressiveAnimationService.createProgressiveAnimation(
      this.conclusionSectionRef,
      'conclusion-main',
      {
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
        pin: false,
        onUpdate: (progress) => {
          this.handleScrollProgress(progress);
        }
      }
    );

    // Adiciona animações de texto com reveal progressivo
    this.addTextAnimations();

    // Adiciona animação do botão
    this.addButtonAnimation();

    // Adiciona efeitos de parallax
    this.addParallaxEffects();

    // Adiciona animações especiais de conclusão
    this.addSpecialEffects();
  }

  private addTextAnimations(): void {
    if (!this.animationTimeline) return;

    // Animação do título principal
    this.progressiveAnimationService.addTextRevealAnimation(
      this.animationTimeline,
      this.conclusionTitleRef,
      {
        duration: 1.2,
        stagger: 0.08,
        ease: 'power4.out',
        from: 'bottom',
        delay: 0.3
      }
    );

    // Animação do texto de contato
    this.progressiveAnimationService.addFadeScaleAnimation(
      this.animationTimeline,
      this.conclusionTextRef,
      {
        duration: 1,
        ease: 'power3.out',
        scale: 0.9,
        delay: 0.8
      }
    );
  }

  private addButtonAnimation(): void {
    if (!this.animationTimeline) return;

    // Animação de entrada do botão
    this.progressiveAnimationService.addFadeScaleAnimation(
      this.animationTimeline,
      this.conclusionButtonRef,
      {
        duration: 0.8,
        ease: 'back.out(1.7)',
        scale: 0.5,
        delay: 1.2
      }
    );

    // Adiciona animação de pulso contínua
    this.animationTimeline.to(this.conclusionButtonRef.nativeElement, {
      scale: 1.05,
      duration: 2,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      delay: 2
    });

    // Adiciona animação de brilho
    this.animationTimeline.to(this.conclusionButtonRef.nativeElement, {
      boxShadow: '0 0 30px rgba(100, 255, 218, 0.6)',
      duration: 3,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      delay: 3
    });
  }

  private addParallaxEffects(): void {
    if (!this.animationTimeline) return;

    // Efeito parallax no título
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.conclusionTitleRef,
      {
        y: -40,
        scale: 1.03,
        ease: 'none'
      }
    );

    // Efeito parallax no texto
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.conclusionTextRef,
      {
        y: 20,
        scale: 1.01,
        ease: 'none'
      }
    );
  }

  private addSpecialEffects(): void {
    if (!this.animationTimeline) return;

    // Adiciona rotação 3D sutil ao botão
    this.progressiveAnimationService.add3DRotationAnimation(
      this.animationTimeline,
      this.conclusionButtonRef,
      {
        rotationY: 5,
        rotationX: 2,
        duration: 2,
        ease: 'power2.out',
        transformOrigin: 'center center'
      }
    );

    // Adiciona animação de cor progressiva
    this.progressiveAnimationService.addColorAnimation(
      this.animationTimeline,
      this.conclusionButtonRef,
      {
        color: '#ffffff',
        backgroundColor: '#64ffda',
        duration: 1.5,
        ease: 'power2.out'
      }
    );
  }

  private handleScrollProgress(progress: number): void {
    // Ajusta a opacidade baseada no progresso
    if (progress > 0.8) {
      const opacity = Math.max(0, 1 - (progress - 0.8) * 5);
      this.conclusionSectionRef.nativeElement.style.opacity = opacity.toString();
    } else {
      this.conclusionSectionRef.nativeElement.style.opacity = '1';
    }

    // Adiciona efeito de blur progressivo
    if (progress > 0.9) {
      const blur = (progress - 0.9) * 10;
      this.conclusionSectionRef.nativeElement.style.filter = `blur(${blur}px)`;
    } else {
      this.conclusionSectionRef.nativeElement.style.filter = 'blur(0px)';
    }
  }

  ngOnDestroy(): void {
    this.progressiveAnimationService.clearAnimation('conclusion-main');
  }
}
