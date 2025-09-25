import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-conclusion',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  private animationTimeline?: gsap.core.Timeline;

  // Propriedades do formulário
  formData = {
    name: '',
    email: '',
    message: ''
  };

  isSubmitting = false;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    setTimeout(() => {
      this.setupAnimations();
    }, 100);
  }

  private setupAnimations(): void {
    if (!this.conclusionSectionRef?.nativeElement) return;

    // Animação do título
    if (this.conclusionTitleRef?.nativeElement) {
      gsap.fromTo(this.conclusionTitleRef.nativeElement,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: this.conclusionTitleRef.nativeElement,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Animação do texto
    if (this.conclusionTextRef?.nativeElement) {
      gsap.fromTo(this.conclusionTextRef.nativeElement,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: this.conclusionTextRef.nativeElement,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Animação dos métodos de contato
    const contactItems = this.conclusionSectionRef.nativeElement.querySelectorAll('.contact-item');
    if (contactItems.length > 0) {
      gsap.fromTo(contactItems,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          delay: 0.5,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: contactItems[0],
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Animação do card principal
    const contactCard = this.conclusionSectionRef.nativeElement.querySelector('.contact-card');
    if (contactCard) {
      gsap.fromTo(contactCard,
        { opacity: 0, scale: 0.95, y: 40 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contactCard,
            start: "top 85%",
            end: "bottom 15%",
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

  onSubmitForm(): void {
    if (this.isSubmitting) return;

    // Redirecionar para a tela de login/registro
    this.router.navigate(['/register']);
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      message: ''
    };
  }
}
