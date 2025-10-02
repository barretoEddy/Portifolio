import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SanityService, Project } from '../services/sanity.service';
import { ProgressiveAnimationService } from '../services/progressive-animation.service';

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
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
  @ViewChild('slider', { read: ElementRef })
  private sliderRef?: ElementRef<HTMLUListElement>;

  private sanityService = inject(SanityService);
  private progressiveAnimationService = inject(ProgressiveAnimationService);
  private animationTimeline?: gsap.core.Timeline;

  projects: Project[] = [];
  isLoading = false; // Mudando para false por padrão
  private animationSetup = false;

  // Toggle functionality
  viewMode: 'grid' | 'carousel' = 'grid';
  currentCarouselIndex = 0;

  ngOnInit(): void {
    // Recuperar preferência salva
    const savedMode = localStorage.getItem('perception-view-mode') as 'grid' | 'carousel';
    if (savedMode) {
      this.viewMode = savedMode;
    }

    // Usar dados mock imediatamente para evitar loading
    this.projects = this.getMockProjects();

    // Tentar carregar dados do Sanity em segundo plano
    this.fetchProjects();
  }

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    // Aguardar um ciclo de detecção de mudanças para garantir que os elementos estejam no DOM
    setTimeout(() => {
      this.setupAnimations();
    }, 200);
  }

  async fetchProjects(): Promise<void> {
    try {
      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 2000);
      });

      const projectsPromise = this.sanityService.getProjects();

      const projects = await Promise.race([projectsPromise, timeoutPromise]) as Project[];

      if (projects && projects.length > 0) {
        this.projects = projects;

        // Configurar animações após carregar conteúdo
        setTimeout(() => {
          this.setupAnimations();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      // Usando dados mock como fallback
    }
  }  private getMockProjects(): Project[] {
    return [
      {
        _id: 'mock-1',
        slug: { current: 'projeto-portfolio' },
        title: 'Projeto Portfolio',
        description: 'Um portfolio moderno e interativo desenvolvido com Angular, GSAP e Sanity CMS.',
        technologies: ['Angular', 'TypeScript', 'GSAP', 'Sanity', 'CSS3'],
        repoUrl: 'https://github.com/eduardoLOEller',
        liveUrl: '#',
        mainImage: {
          asset: {
            url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=300&fit=crop'
          }
        }
      },
      {
        _id: 'mock-2',
        slug: { current: 'sistema-web-moderno' },
        title: 'Sistema Web Moderno',
        description: 'Aplicação web completa com funcionalidades avançadas e design responsivo.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        repoUrl: 'https://github.com/eduardoLOEller',
        liveUrl: '#',
        mainImage: {
          asset: {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop'
          }
        }
      },
      {
        _id: 'mock-3',
        slug: { current: 'app-mobile' },
        title: 'App Mobile',
        description: 'Aplicativo móvel cross-platform com interface intuitiva e performance otimizada.',
        technologies: ['React Native', 'JavaScript', 'Firebase'],
        repoUrl: 'https://github.com/eduardoLOEller',
        liveUrl: '#',
        mainImage: {
          asset: {
            url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=300&fit=crop'
          }
        }
      }
    ];
  }

  getProjectImageUrl(image: any): string {
    if (image && image.asset && image.asset.url) {
      return image.asset.url;
    }
    if (image && image.asset && image.asset._ref) {
      return this.sanityService.getImageUrl(image).url();
    }
    if (image) {
      try {
        return this.sanityService.getImageUrl(image).url();
      } catch (error) {
        console.warn('Erro ao processar imagem:', error);
      }
    }
    // Fallback para uma imagem placeholder mais confiável
    return 'https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=500&h=300&fit=crop';
  }

  private setupAnimations(): void {
    if (this.animationSetup) return;

    // Verificar se todos os elementos necessários existem
    if (!this.perceptionTitleRef?.nativeElement || !this.projectsContainerRef?.nativeElement) {
      // Tentar novamente após um breve delay
      setTimeout(() => {
        this.setupAnimations();
      }, 100);
      return;
    }

    this.animationSetup = true;
    this.contentRendered.emit();

    // Animação do título
    if (this.perceptionTitleRef?.nativeElement) {
      gsap.fromTo(this.perceptionTitleRef.nativeElement,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: this.perceptionTitleRef.nativeElement,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Animação dos projetos
    if (this.projectsContainerRef?.nativeElement) {
      const projectItems = this.projectsContainerRef.nativeElement.querySelectorAll('.project-item');
      if (projectItems.length > 0) {
        gsap.fromTo(projectItems,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: this.projectsContainerRef.nativeElement,
              start: "top 80%",
              end: "bottom 20%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animationTimeline) {
      this.animationTimeline.kill();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  trackByProjectId(index: number, project: Project): string {
    return project._id;
  }

  trackByTech(index: number, tech: string): string {
    return tech;
  }

  // Toggle functionality methods
  switchView(mode: 'grid' | 'carousel'): void {
    if (this.viewMode === mode) return;

    const oldMode = this.viewMode;
    this.viewMode = mode;

    // Animação de transição entre views
    this.animateViewTransition(oldMode, mode);

    // Salvar preferência do usuário
    localStorage.setItem('perception-view-mode', mode);
  }

  private animateViewTransition(from: string, to: string): void {
    if (!this.projectsContainerRef?.nativeElement) return;

    const container = this.projectsContainerRef.nativeElement;

    gsap.timeline()
      .to(container, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.out"
      })
      .call(() => {
        // View change happens here
        if (to === 'carousel') {
          setTimeout(() => this.setupCarouselAnimations(), 100);
        } else {
          setTimeout(() => this.setupGridAnimations(), 100);
        }
      })
      .to(container, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      });
  }

  private setupCarouselAnimations(): void {
    // Placeholder para animações do carrossel
    console.log('Setting up carousel animations');
  }

  private setupGridAnimations(): void {
    // Re-setup das animações do grid existente
    if (this.projectsContainerRef?.nativeElement) {
      const projectItems = this.projectsContainerRef.nativeElement.querySelectorAll('.project-item');
      if (projectItems.length > 0) {
        gsap.fromTo(projectItems,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.3,
            ease: "power2.out"
          }
        );
      }
    }
  }

  // CodePen Carousel Methods
  nextSlide(): void {
    if (!this.sliderRef?.nativeElement) return;

    const items = this.sliderRef.nativeElement.querySelectorAll('.item');
    if (items.length === 0) return;

    // Move the first item to the end (append)
    this.sliderRef.nativeElement.appendChild(items[0]);
  }

  previousSlide(): void {
    if (!this.sliderRef?.nativeElement) return;

    const items = this.sliderRef.nativeElement.querySelectorAll('.item');
    if (items.length === 0) return;

    // Move the last item to the beginning (prepend)
    this.sliderRef.nativeElement.prepend(items[items.length - 1]);
  }
}
