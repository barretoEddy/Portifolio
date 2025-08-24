import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SanityService, Project } from '../services/sanity.service';
import { ProgressiveAnimationService } from '../services/progressive-animation.service';
import { TextRevealDirective } from '../directives/text-reveal.directive';
import { ParallaxDirective } from '../directives/parallax.directive';

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule, TextRevealDirective, ParallaxDirective],
  templateUrl: './perception.component.html',
  styleUrl: './perception.component.css'
})
export class PerceptionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() contentRendered = new EventEmitter<void>();
  @ViewChild('perceptionSection', { static: true, read: ElementRef })
  private perceptionSectionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('perceptionTitle', { static: true, read: ElementRef })
  private perceptionTitleRef!: ElementRef<HTMLHeadingElement>;
  @ViewChild('projectsContainer', { static: true, read: ElementRef })
  private projectsContainerRef!: ElementRef<HTMLDivElement>;

  private sanityService = inject(SanityService);
  private progressiveAnimationService = inject(ProgressiveAnimationService);
  private animationTimeline?: gsap.core.Timeline;

  projects: Project[] = [];
  isLoading = true;
  private animationSetup = false;

  ngOnInit(): void {
    this.fetchProjects();
  }

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    // As animações serão configuradas após o conteúdo ser carregado
  }

  async fetchProjects(): Promise<void> {
    this.isLoading = true;
    try {
      this.projects = await this.sanityService.getProjects();
    } finally {
      this.isLoading = false;
      // Emite o evento imediatamente após carregar os projetos
      setTimeout(() => {
        this.contentRendered.emit();
        if (!this.animationSetup) {
          this.setupPerceptionAnimations();
          this.animationSetup = true;
        }
      }, 50); // Reduzido de 100ms para 50ms
    }
  }

  private setupPerceptionAnimations(): void {
    // Cria timeline principal para a seção perception
    this.animationTimeline = this.progressiveAnimationService.createProgressiveAnimation(
      this.perceptionSectionRef,
      'perception-main',
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

    // Adiciona animação dos projetos
    this.addProjectsAnimation();

    // Adiciona efeitos de parallax
    this.addParallaxEffects();
  }

  private addTitleAnimation(): void {
    if (!this.animationTimeline) return;

    // Animação do título principal
    this.progressiveAnimationService.addTextRevealAnimation(
      this.animationTimeline,
      this.perceptionTitleRef,
      {
        duration: 1.0, // Reduzido de 1.2 para 1.0
        stagger: 0.06, // Reduzido de 0.08 para 0.06
        ease: 'power4.out',
        from: 'left',
        delay: 0.2 // Reduzido de 0.3 para 0.2
      }
    );
  }

  private addProjectsAnimation(): void {
    if (!this.animationTimeline) return;

    const projectItems = this.projectsContainerRef.nativeElement.querySelectorAll('.project-item');

    projectItems.forEach((project: Element, index: number) => {
      const projectElement = project as HTMLElement;
      const projectImage = project.querySelector('.project-image');
      const projectInfo = project.querySelector('.project-info');
      const projectTitle = project.querySelector('.project-title');
      const projectDescription = project.querySelector('.project-description');
      const projectTechList = project.querySelector('.project-tech-list');
      const projectLinks = project.querySelector('.project-links');

      // Animação de entrada do projeto com stagger mais rápido
      this.animationTimeline!.from(projectElement, {
        opacity: 0,
        y: 80, // Reduzido de 100 para 80
        scale: 0.9,
        duration: 0.6, // Reduzido de 0.8 para 0.6
        ease: 'back.out(1.7)',
        delay: 0.3 + (index * 0.2) // Reduzido o delay entre projetos
      });

      // Animação da imagem do projeto
      if (projectImage) {
        this.animationTimeline!.from(projectImage, {
          scale: 0.8,
          rotationY: 15,
          opacity: 0,
          duration: 0.5, // Reduzido de 0.6 para 0.5
          ease: 'power3.out',
          delay: 0.5 + (index * 0.2)
        });
      }

      // Animação das informações do projeto
      if (projectInfo) {
        const infoElements = [projectTitle, projectDescription, projectTechList, projectLinks];
        infoElements.forEach((element, elementIndex) => {
          if (element) {
            this.animationTimeline!.from(element, {
              opacity: 0,
              x: index % 2 === 0 ? -30 : 30, // Reduzido de 50 para 30
              duration: 0.4, // Reduzido de 0.5 para 0.4
              ease: 'power3.out',
              delay: 0.6 + (index * 0.2) + (elementIndex * 0.08) // Reduzido o delay
            });
          }
        });
      }

      // Adiciona animação de hover para cada projeto
      this.animationTimeline!.to(projectElement, {
        y: -8, // Reduzido de -10 para -8
        scale: 1.02,
        duration: 3,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        delay: 2 + (index * 0.3) // Reduzido o delay
      });
    });
  }

  private addParallaxEffects(): void {
    if (!this.animationTimeline) return;

    // Efeito parallax no título
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.perceptionTitleRef,
      {
        y: -20, // Reduzido de -30 para -20
        scale: 1.01, // Reduzido de 1.02 para 1.01
        ease: 'none'
      }
    );

    // Efeito parallax no container de projetos
    this.progressiveAnimationService.addParallaxAnimation(
      this.animationTimeline,
      this.projectsContainerRef,
      {
        y: 15, // Reduzido de 20 para 15
        scale: 1.01,
        ease: 'none'
      }
    );
  }

  private handleScrollProgress(progress: number): void {
    // Ajusta a opacidade baseada no progresso
    if (progress > 0.8) {
      const opacity = Math.max(0, 1 - (progress - 0.8) * 5);
      this.perceptionSectionRef.nativeElement.style.opacity = opacity.toString();
    } else {
      this.perceptionSectionRef.nativeElement.style.opacity = '1';
    }

    // Adiciona efeito de blur progressivo
    if (progress > 0.9) {
      const blur = (progress - 0.9) * 10;
      this.perceptionSectionRef.nativeElement.style.filter = `blur(${blur}px)`;
    } else {
      this.perceptionSectionRef.nativeElement.style.filter = 'blur(0px)';
    }
  }

  getProjectImageUrl(source: any) {
    return this.sanityService.getImageUrl(source).width(600).url(); // Reduzido de 800 para 600 para melhor performance
  }

  ngOnDestroy(): void {
    this.progressiveAnimationService.clearAnimation('perception-main');
  }
}
