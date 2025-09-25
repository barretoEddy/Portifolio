import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabin.component.html',
  styleUrls: ['./cabin.component.css']
})
export class CabinComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cabinSection') cabinSection!: ElementRef<HTMLElement>;
  @ViewChild('cabinTitle') cabinTitle!: ElementRef<HTMLElement>;
  @ViewChild('cabinTexts') cabinTexts!: ElementRef<HTMLElement>;
  @ViewChild('aboutImage') aboutImage!: ElementRef<HTMLElement>;

  private scrollTriggerInstance: ScrollTrigger | null = null;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    this.setupSectionAnimation();
  }

  scrollToPortfolio(): void {
    const perceptionSection = document.getElementById('perception');
    if (perceptionSection) {
      // Usando GSAP para um scroll mais suave e controlado
      gsap.to(window, {
        duration: 1.5,
        scrollTo: {
          y: perceptionSection,
          offsetY: 80 // Offset para não ficar colado no topo
        },
        ease: "power3.out"
      });
    }
  }
  scrollToContact(): void {
    const conclusionSection = document.getElementById('conclusion');
    if (conclusionSection) {
      // Usando GSAP para um scroll mais suave e controlado
      gsap.to(window, {
        duration: 1.5,
        scrollTo: {
          y: conclusionSection,
          offsetY: 80 // Offset para não ficar colado no topo
        },
        ease: "power3.out"
      });
    }
  }

  private setupSectionAnimation(): void {
    // Garante que todos os elementos de referência foram carregados
    if (!this.cabinSection || !this.cabinTitle || !this.cabinTexts || !this.aboutImage) {
      console.error('Um ou mais elementos para a animação não foram encontrados.');
      return;
    }

    const elementsToAnimate = [
      this.cabinTitle.nativeElement,
      this.cabinTexts.nativeElement,
      this.aboutImage.nativeElement
    ];

    // Define o estado inicial da animação (invisível e deslocado para baixo)
    gsap.set(elementsToAnimate, { opacity: 0, y: 50 });

    // Cria a animação de revelação com ScrollTrigger
    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: this.cabinSection.nativeElement,
      start: 'top 30%', // Inicia quando 70% da seção está visível
      onEnter: () => {
        gsap.to(elementsToAnimate, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2, // Anima cada elemento com um atraso de 0.2s
        });
      },
      // Opcional: reverte a animação ao sair da tela
      onLeaveBack: () => {
        gsap.to(elementsToAnimate, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          ease: 'power3.in',
        });
      },
    });
  }

  ngOnDestroy(): void {
    // Limpa a instância do ScrollTrigger para evitar vazamentos de memória
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }
  }
}
