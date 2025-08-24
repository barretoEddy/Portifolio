import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProgressiveAnimationService } from '../services/progressive-animation.service';
import { TextRevealDirective } from '../directives/text-reveal.directive';
import { Timeline } from 'animejs';

@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule, TextRevealDirective],
  templateUrl: './cabin.component.html',
  styleUrl: './cabin.component.css'
})
export class CabinComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cabinSection', { static: true, read: ElementRef })
  private cabinSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cabinTitle', { static: true, read: ElementRef })
  private cabinTitleRef!: ElementRef<HTMLHeadingElement>;
  @ViewChild('cabinTexts', { static: true, read: ElementRef })
  private cabinTextsRef!: ElementRef<HTMLDivElement>;
  @ViewChild('skillsList', { static: true, read: ElementRef })
  private skillsListRef!: ElementRef<HTMLUListElement>;
  @ViewChild('aboutImage', { static: true, read: ElementRef })
  private aboutImageRef!: ElementRef<HTMLDivElement>;

  private progressiveAnimationService = inject(ProgressiveAnimationService);
  private animationTimeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupCabinAnimations();
  }

  private setupCabinAnimations(): void {
    // Cria timeline principal para a seção cabin
    this.animationTimeline = this.progressiveAnimationService.createProgressiveAnimation(
      this.cabinSectionRef,
      'cabin-main',
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

    // Adiciona animação da lista de skills
    this.addSkillsAnimation();

    // Adiciona animação da imagem
    this.addImageAnimation();

    // Adiciona efeitos de parallax
    this.addParallaxEffects();
  }

  private addTextAnimations(): void {
    if (!this.animationTimeline) return;

    // Animação do título principal
    this.progressiveAnimationService.addTextRevealAnimation(
      this.animationTimeline,
      this.cabinTitleRef,
      {
        duration: 1,
        stagger: 0.06,
        ease: 'power4.out',
        from: 'left',
        delay: 0.2
      }
    );

    // Animação dos parágrafos de texto
    const textElements = this.cabinTextsRef.nativeElement.querySelectorAll('p');
    textElements.forEach((text: HTMLElement, index: number) => {
      if (this.animationTimeline) {
        this.progressiveAnimationService.addFadeScaleAnimation(
          this.animationTimeline,
          { nativeElement: text } as ElementRef<HTMLElement>,
          {
            duration: 0.8,
            ease: 'power3.out',
            scale: 0.9,
            delay: 0.5 + (index * 0.2)
          }
        );
      }
    });
  }

  private addSkillsAnimation(): void {
    if (!this.animationTimeline) return;

    const skillItems = this.skillsListRef.nativeElement.querySelectorAll('li');
    const skillElements: ElementRef<HTMLElement>[] = Array.from(skillItems).map(
      (item: Element) => ({ nativeElement: item as HTMLElement } as ElementRef<HTMLElement>)
    );

    // Animação de entrada com stagger para as skills
    this.progressiveAnimationService.addStaggerAnimation(
      this.animationTimeline,
      skillElements,
      {
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        from: 'right',
        delay: 1.2
      }
    );

    // Adiciona animação de hover contínua para as skills
    skillItems.forEach((skill: Element, index: number) => {
      const skillElement = skill as HTMLElement;
      this.animationTimeline!.to(skillElement, {
        y: -3,
        scale: 1.05,
        duration: 2,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        delay: 2 + (index * 0.1)
      });
    });
  }

  private addImageAnimation(): void {
    if (!this.animationTimeline) return;

    // Animação de entrada da imagem com efeito de escala
    this.progressiveAnimationService.addFadeScaleAnimation(
      this.animationTimeline,
      this.aboutImageRef,
      {
        duration: 1.2,
        ease: 'back.out(1.7)',
        scale: 0.7,
        delay: 0.8
      }
    );

    // Adiciona rotação 3D sutil
    this.progressiveAnimationService.add3DRotationAnimation(
      this.animationTimeline,
      this.aboutImageRef,
      {
        rotationY: 5,
        rotationX: 2,
        duration: 1.5,
        ease: 'power2.out',
        transformOrigin: 'center center'
      }
    );
  }

  private addParallaxEffects(): void {
    if (!this.animationTimeline) return;

    // Efeito parallax no título
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.cabinTitleRef,
      {
        y: -30,
        scale: 1.02,
        ease: 'none'
      }
    );

    // Efeito parallax na imagem
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.aboutImageRef,
      {
        y: 20,
        scale: 1.05,
        ease: 'none'
      }
    );
  }

  private handleScrollProgress(progress: number): void {
    // Ajusta a opacidade baseada no progresso
    if (progress > 0.8) {
      const opacity = Math.max(0, 1 - (progress - 0.8) * 5);
      this.cabinSectionRef.nativeElement.style.opacity = opacity.toString();
    } else {
      this.cabinSectionRef.nativeElement.style.opacity = '1';
    }
  }

  ngOnDestroy(): void {
    this.progressiveAnimationService.clearAnimation('cabin-main');
  }
}
