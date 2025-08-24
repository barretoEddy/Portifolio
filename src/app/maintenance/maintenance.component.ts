import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProgressiveAnimationService } from '../services/progressive-animation.service';
import { TextRevealDirective } from '../directives/text-reveal.directive';
import { ParallaxDirective } from '../directives/parallax.directive';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, TextRevealDirective, ParallaxDirective],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css'
})
export class MaintenanceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('maintenanceSection', { static: true, read: ElementRef })
  private maintenanceSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('maintenanceTitle', { static: true, read: ElementRef })
  private maintenanceTitleRef!: ElementRef<HTMLHeadingElement>;
  @ViewChild('servicesGrid', { static: true, read: ElementRef })
  private servicesGridRef!: ElementRef<HTMLDivElement>;
  @ViewChild('serviceCards', { static: true, read: ElementRef })
  private serviceCardsRef!: ElementRef<HTMLDivElement>;

  private progressiveAnimationService = inject(ProgressiveAnimationService);
  private animationTimeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupMaintenanceAnimations();
  }

  private setupMaintenanceAnimations(): void {
    // Cria timeline principal para a seção maintenance
    this.animationTimeline = this.progressiveAnimationService.createProgressiveAnimation(
      this.maintenanceSectionRef,
      'maintenance-main',
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
    this.addTitleAnimation();

    // Adiciona animação dos cards de serviço
    this.addServiceCardsAnimation();

    // Adiciona efeitos de parallax
    this.addParallaxEffects();

    // Adiciona animações de ícones
    this.addIconAnimations();
  }

  private addTitleAnimation(): void {
    if (!this.animationTimeline) return;

    // Animação do título principal
    this.progressiveAnimationService.addTextRevealAnimation(
      this.animationTimeline,
      this.maintenanceTitleRef,
      {
        duration: 1.2,
        stagger: 0.08,
        ease: 'power4.out',
        from: 'top',
        delay: 0.3
      }
    );
  }

  private addServiceCardsAnimation(): void {
    if (!this.animationTimeline) return;

    const serviceCards = this.serviceCardsRef.nativeElement.querySelectorAll('.service-card');
    const cardElements: ElementRef<HTMLElement>[] = Array.from(serviceCards).map(
      (card: Element) => ({ nativeElement: card as HTMLElement } as ElementRef<HTMLElement>)
    );

    // Animação de entrada com stagger para os cards
    this.progressiveAnimationService.addStaggerAnimation(
      this.animationTimeline,
      cardElements,
      {
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)',
        from: 'bottom',
        delay: 0.8
      }
    );

    // Adiciona animação de hover para cada card
    serviceCards.forEach((card: Element, index: number) => {
      const cardElement = card as HTMLElement;
      // Animação de entrada com rotação 3D
      this.animationTimeline!.from(cardElement, {
        rotationY: 45,
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: 1.2 + (index * 0.2)
      });

      // Adiciona efeito de hover contínuo
      this.animationTimeline!.to(cardElement, {
        y: -5,
        scale: 1.02,
        duration: 3,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        delay: 3 + (index * 0.3)
      });
    });
  }

  private addIconAnimations(): void {
    if (!this.animationTimeline) return;

    const icons = this.serviceCardsRef.nativeElement.querySelectorAll('.service-icon svg');

    icons.forEach((icon: Element, index: number) => {
      const iconElement = icon as HTMLElement;
      // Animação de entrada do ícone
      this.animationTimeline!.from(iconElement, {
        scale: 0,
        rotation: 180,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 1.5 + (index * 0.2)
      });

      // Animação de rotação contínua sutil
      this.animationTimeline!.to(iconElement, {
        rotation: 360,
        duration: 20,
        ease: 'none',
        repeat: -1,
        delay: 4 + (index * 0.5)
      });
    });
  }

  private addParallaxEffects(): void {
    if (!this.animationTimeline) return;

    // Efeito parallax no título
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.maintenanceTitleRef,
      {
        y: -40,
        scale: 1.03,
        ease: 'none'
      }
    );

    // Efeito parallax no grid de serviços
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.servicesGridRef,
      {
        y: 30,
        scale: 1.02,
        ease: 'none'
      }
    );
  }

  private handleScrollProgress(progress: number): void {
    // Ajusta a opacidade baseada no progresso
    if (progress > 0.8) {
      const opacity = Math.max(0, 1 - (progress - 0.8) * 5);
      this.maintenanceSectionRef.nativeElement.style.opacity = opacity.toString();
    } else {
      this.maintenanceSectionRef.nativeElement.style.opacity = '1';
    }

    // Adiciona efeito de blur progressivo
    if (progress > 0.9) {
      const blur = (progress - 0.9) * 10;
      this.maintenanceSectionRef.nativeElement.style.filter = `blur(${blur}px)`;
    } else {
      this.maintenanceSectionRef.nativeElement.style.filter = 'blur(0px)';
    }
  }

  ngOnDestroy(): void {
    this.progressiveAnimationService.clearAnimation('maintenance-main');
  }
}
