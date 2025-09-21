import { Component, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { HeroComponent } from '../hero/hero.component';
import { CabinComponent } from '../cabin/cabin.component';
import { MaintenanceComponent } from '../maintenance/maintenance.component';
import { PerceptionComponent } from '../perception/perception.component';
import { ConclusionComponent } from '../conclusion/conclusion.component';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TitleComponent } from "../title/title.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, HeaderComponent, FooterComponent, HeroComponent, CabinComponent,
    MaintenanceComponent, PerceptionComponent, ConclusionComponent,
    TitleComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  private ctx!: gsap.Context;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    // Aguarda um pouco mais para garantir que todos os componentes estejam renderizados
    setTimeout(() => {
      const main = this.elementRef.nativeElement;
      this.ctx = gsap.context(() => {
        // Animações para seções com conteúdo estático
        this.setupStaticAnimation('#cabin');
        this.setupStaticAnimation('#maintenance');
        this.setupStaticAnimation('#conclusion');
      }, main);
    }, 1000); // Aumentado de 500ms para 1000ms para garantir renderização completa
  }

  public onPerceptionRendered(): void {
    if (this.ctx) {
      this.ctx.add(() => {
        this.setupPerceptionAnimation();
      });
    }
  }

  private setupStaticAnimation(sectionId: string): void {
    const section = this.elementRef.nativeElement.querySelector(sectionId);
    if (section) {
      const children = gsap.utils.toArray((section.children[0] as HTMLElement).children);
      gsap.from(children, {
        y: 50,
        opacity: 0,
        stagger: 0.1, // Reduzido de 0.15 para 0.1 para animação mais rápida
        duration: 0.6, // Reduzido de 0.8 para 0.6
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  private setupPerceptionAnimation(): void {
    const section = this.elementRef.nativeElement.querySelector('#perception');
    if (!section) return;

    const title = section.querySelector('.section-title');
    const projectItems = gsap.utils.toArray(section.querySelectorAll('.project-item'));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        scrub: 1,
        start: 'top 80%',
        end: 'bottom 80%',
      }
    });

    tl.from(title, {
      opacity: 0,
      y: 50,
      ease: 'power2.out',
      duration: 0.8 // Reduzido para animação mais rápida
    });

    projectItems.forEach((item: any, index) => {
      tl.from(item, {
        autoAlpha: 0,
        y: 80, // Reduzido de 100 para 80
        ease: 'power3.out',
        duration: 0.6 // Reduzido de 0.8 para 0.6
      }, '-=0.5'); // Reduzido o overlap
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
