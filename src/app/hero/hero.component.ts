import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, HostListener, Renderer2 } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CommonModule } from '@angular/common';
import { ThreeDKeyboardService } from '../services/three-d-keyboard.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webglCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroTitle', { static: true, read: ElementRef })
  private heroTitleRef!: ElementRef<HTMLDivElement>;
  @ViewChild('heroSection', { static: true, read: ElementRef })
  private heroSectionRef!: ElementRef<HTMLDivElement>;

  private threeDService = inject(ThreeDKeyboardService);
  private renderer = inject(Renderer2);
  private keyboardShown = false;
  private keyboardBuilt = false;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupHeroAnimation();
  }

  private setupHeroAnimation(): void {
    const heroSection = this.heroSectionRef.nativeElement;
    const heroTitle = this.heroTitleRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    // Garante que o título está visível inicialmente
    this.renderer.setStyle(heroTitle, 'opacity', '1');
    this.renderer.setStyle(heroTitle, 'transform', 'translateY(0) scale(1)');
    this.renderer.removeStyle(heroTitle, 'filter');

    // Inicialmente esconde o canvas
    this.renderer.setStyle(canvas, 'display', 'none');
    this.renderer.setStyle(canvas, 'opacity', '0');
    this.renderer.removeStyle(canvas, 'filter');

    // Animação de entrada inicial do título
    gsap.from(heroTitle, {
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3,
      onComplete: () => {
        // Garante que o título fica visível após a animação inicial
        this.resetTitleState();
      }
    });

    // Timeline para controlar título e teclado
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: '+=2000', // Aumentado para dar mais tempo para a animação
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          this.handleScrollProgress(self.progress);
        },
        onEnter: () => {
          // Garante que o título está visível quando entra na seção
          this.resetTitleState();
        },
        onEnterBack: () => {
          // Garante que o título reaparece quando volta para o topo
          this.resetTitleState();
        },
      },
    });

    // Animação do título desaparecendo (começa após 20% do scroll)
    tl.to(heroTitle, {
      opacity: 0,
      y: -100,
      scale: 0.8,
      duration: 1,
      ease: 'power2.inOut',
      // Removido qualquer efeito de blur
    }, 0.2);

    // Animação do canvas aparecendo no centro (começa após 40% do scroll)
    tl.to(canvas, {
      opacity: 1,
      scale: 1.2,
      duration: 1.5,
      ease: 'power3.out',
      onStart: () => {
        this.showKeyboard();
      }
    }, 0.4);

    // Animação contínua do canvas no centro
    tl.to(canvas, {
      rotation: 3,
      duration: 3,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    }, 1.0);
  }

  private showKeyboard(): void {
    const canvas = this.canvasRef.nativeElement;

    if (!this.keyboardShown) {
      // Garante que o canvas está visível e centralizado
      this.renderer.setStyle(canvas, 'display', 'block');
      this.renderer.setStyle(canvas, 'position', 'absolute');
      this.renderer.setStyle(canvas, 'top', '50%');
      this.renderer.setStyle(canvas, 'left', '50%');
      this.renderer.setStyle(canvas, 'transform', 'translate(-50%, -50%) scale(1.2)');
      this.renderer.setStyle(canvas, 'width', '100%');
      this.renderer.setStyle(canvas, 'height', '100%');
      this.renderer.addClass(canvas, 'centered');

      // Cria a cena 3D
      this.threeDService.createScene(this.canvasRef, () => {
        if (!this.keyboardBuilt) {
          this.threeDService.animateKeyboardBuild();
          this.keyboardBuilt = true;
        }
      });
      this.keyboardShown = true;
    }
  }

  private hideKeyboard(): void {
    const canvas = this.canvasRef.nativeElement;

    if (this.keyboardShown) {
      // Remove os estilos de centralização
      this.renderer.removeClass(canvas, 'centered');
      this.renderer.setStyle(canvas, 'position', 'absolute');
      this.renderer.setStyle(canvas, 'top', '0');
      this.renderer.setStyle(canvas, 'left', '0');
      this.renderer.setStyle(canvas, 'transform', 'scale(1)');
      this.renderer.setStyle(canvas, 'display', 'none');
      this.renderer.setStyle(canvas, 'opacity', '0');
      this.keyboardShown = false;
    }
  }

  private resetTitleState(): void {
    const heroTitle = this.heroTitleRef.nativeElement;
    this.renderer.setStyle(heroTitle, 'opacity', '1');
    this.renderer.setStyle(heroTitle, 'transform', 'translateY(0) scale(1)');
    this.renderer.removeStyle(heroTitle, 'filter');
  }

  private handleScrollProgress(progress: number): void {
    const canvas = this.canvasRef.nativeElement;
    const heroTitle = this.heroTitleRef.nativeElement;

    // Controle de visibilidade do título com reversão
    if (progress < 0.2) {
      // Título visível nos primeiros 20%
      this.renderer.setStyle(heroTitle, 'opacity', '1');
      this.renderer.setStyle(heroTitle, 'transform', 'translateY(0) scale(1)');
      this.renderer.removeStyle(heroTitle, 'filter'); // Remove qualquer filtro
    } else if (progress > 0.2 && progress < 0.4) {
      // Título desaparecendo entre 20% e 40%
      const opacity = Math.max(0, 1 - ((progress - 0.2) / 0.2) * 1);
      const scale = Math.max(0.8, 1 - ((progress - 0.2) / 0.2) * 0.2);
      this.renderer.setStyle(heroTitle, 'opacity', opacity.toString());
      this.renderer.setStyle(heroTitle, 'transform', `translateY(-${(progress - 0.2) * 500}px) scale(${scale})`);
      this.renderer.removeStyle(heroTitle, 'filter'); // Remove qualquer filtro
    } else {
      // Título completamente escondido após 40%
      this.renderer.setStyle(heroTitle, 'opacity', '0');
      this.renderer.setStyle(heroTitle, 'transform', 'translateY(-100px) scale(0.8)');
      this.renderer.removeStyle(heroTitle, 'filter'); // Remove qualquer filtro
    }

    // Controle do teclado baseado no scroll
    if (progress > 0.4 && !this.keyboardShown) {
      // Monta o teclado quando scroll down atinge 40%
      this.showKeyboard();
    } else if (progress <= 0.3 && this.keyboardShown) {
      // Desmonta o teclado quando scroll up volta para 30%
      this.hideKeyboard();
    }

    // Ajusta a opacidade do canvas baseada no progresso
    if (progress > 0.4 && progress < 0.6) {
      const canvasOpacity = Math.min(1, (progress - 0.4) / 0.2);
      this.renderer.setStyle(canvas, 'opacity', canvasOpacity.toString());
      this.renderer.removeStyle(canvas, 'filter'); // Remove qualquer filtro
    } else if (progress >= 0.6) {
      this.renderer.setStyle(canvas, 'opacity', '1');
      this.renderer.removeStyle(canvas, 'filter'); // Remove qualquer filtro
    } else {
      this.renderer.setStyle(canvas, 'opacity', '0');
      this.renderer.removeStyle(canvas, 'filter'); // Remove qualquer filtro
    }
  }

  ngOnDestroy(): void {
    this.threeDService.ngOnDestroy();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.keyboardShown) {
      this.threeDService.resize();
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.keyboardShown) {
      this.threeDService.updateMousePosition(event);
    }
  }
}
