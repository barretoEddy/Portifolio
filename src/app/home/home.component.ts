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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, HeaderComponent, FooterComponent, HeroComponent, CabinComponent,
    MaintenanceComponent, PerceptionComponent, ConclusionComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  private ctx!: gsap.Context;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const main = this.elementRef.nativeElement;
      this.ctx = gsap.context(() => {
        // Animações para seções com conteúdo estático
        this.setupStaticAnimation('#cabin');
        this.setupStaticAnimation('#maintenance');
        this.setupStaticAnimation('#conclusion');
      }, main);
    }, 500); // Um timeout ligeiramente maior para garantir tudo
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
        stagger: 0.15,
        duration: 0.8,
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

    tl.from(title, { opacity: 0, y: 50, ease: 'power2.out' });
    projectItems.forEach((item: any, index) => {
      tl.from(item, { autoAlpha: 0, y: 100, ease: 'power3.out' }, '-=0.7');
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
