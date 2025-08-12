import { Component, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perception.component.html',
  styleUrl: './perception.component.css'
})
export class PerceptionComponent implements AfterViewInit, OnDestroy {

  private triggers: ScrollTrigger[] = [];

  // Seus dados de projetos
  projects = [
    {
      title: 'Nome do Projeto 1',
      description: 'Uma breve descrição sobre o projeto...',
      tech: ['Angular', 'TypeScript', 'Firebase', 'SCSS'],
      liveUrl: '#',
      repoUrl: '#'
    },
    {
      title: 'Nome do Projeto 2',
      description: 'Outro projeto incrível...',
      tech: ['React', 'Next.js', 'Vercel', 'TailwindCSS'],
      liveUrl: '#',
      repoUrl: '#'
    },
    {
      title: 'Nome do Projeto 3',
      description: 'Este projeto pode ser um aplicativo mobile...',
      tech: ['Vue', 'Node.js', 'MongoDB', 'GraphQL'],
      liveUrl: '#',
      repoUrl: '#'
    }
  ];

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // Usamos um pequeno atraso para garantir que o @for do Angular terminou 100%
    setTimeout(() => {
      this.initAnimations();
    }, 100);
  }

  private initAnimations(): void {
    const projectItems: HTMLElement[] = this.elementRef.nativeElement.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
      const image = item.querySelector('.project-image');
      const info = item.querySelector('.project-info');

      if (!image || !info) return;

      // Criamos uma timeline de animação para este item.
      // O ScrollTrigger agora fica DENTRO da timeline, o que nos dá mais controle.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          end: 'bottom top', // Define um fim para a área de ação

          // ESTA É A MUDANÇA PRINCIPAL!
          // 'play': Anima ao entrar na tela (scroll para baixo)
          // 'none': Não faz nada ao sair da tela (scroll para baixo)
          // 'none': Não faz nada ao re-entrar na tela (scroll para cima)
          // 'reverse': Reverte a animação ao sair da tela (scroll para cima)
          toggleActions: 'restart pause none reverse',

          // markers: true, // depuração
        }
      });

      const isEven = index % 2 === 0;

      // Usamos .from() que anima DE um estado para o estado atual no CSS.
      // Isso simplifica o código, não precisamos mais do gsap.set().
      if (isEven) {
        // PROJETO PAR: Imagem da esquerda, texto da direita
        tl
          .from(image, { x: -100, opacity: 0, duration: 1, ease: 'power3.out' })
          .from(info, { x: 100, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.8'); // Começa 0.8s antes do fim da animação da imagem
      } else {
        // PROJETO ÍMPAR: Imagem da direita, texto da esquerda
        tl
          .from(image, { x: 100, opacity: 0, duration: 1, ease: 'power3.out' })
          .from(info, { x: -100, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.8');
      }

      // Guardamos a referência do ScrollTrigger da timeline para limpar depois
      this.triggers.push(tl.scrollTrigger!);
    });
  }

  ngOnDestroy(): void {
    this.triggers.forEach(trigger => trigger.kill());
  }
}
