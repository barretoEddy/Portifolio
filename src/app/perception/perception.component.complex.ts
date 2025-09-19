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
      const projects = await this.sanityService.getProjects();
      this.projects = projects || this.getMockProjects();
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      this.projects = this.getMockProjects();
    } finally {
      this.isLoading = false;
      
      // Configurar animações após carregar conteúdo
      setTimeout(() => {
        this.setupAnimations();
      }, 100);
    }
  }

  private getMockProjects(): Project[] {
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
            url: '/img/perfil.jpg'
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
            url: '/img/perfil.jpg'
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
            url: '/img/perfil.jpg'
          }
        }
      }
    ];
  }

  getProjectImageUrl(image: any): string {
    if (image && image.asset && image.asset.url) {
      return image.asset.url;
    }
    return '/img/perfil.jpg';
  }

  private setupAnimations(): void {
    if (this.animationSetup) return;
    
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

  ngOnDestroy(): void {
    if (this.animationTimeline) {
      this.animationTimeline.kill();
    }
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}