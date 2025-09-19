import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.css']
})
export class MaintenanceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('maintenanceSection') maintenanceSection!: ElementRef<HTMLElement>;
  @ViewChild('maintenanceTitle') maintenanceTitle!: ElementRef<HTMLElement>;
  @ViewChildren('serviceCards') serviceCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('servicesGrid') servicesGrid!: ElementRef<HTMLElement>;

  private tl: gsap.core.Timeline | null = null;

  // Estado de expansão dos cards
  expandedCards: Set<number> = new Set();

  // Dados dos serviços para exibir texto completo
  services = [
    {
      title: 'Desenvolvimento Web',
      description: 'Criação de sites e aplicações web modernas com as melhores tecnologias do mercado, garantindo performance, responsividade e excelente experiência do usuário.'
    },
    {
      title: 'UI/UX Design',
      description: 'Design de interfaces intuitivas e experiências de usuário excepcionais, focando na usabilidade, acessibilidade e conversão através de pesquisa e testes.'
    },
    {
      title: 'Aplicações SPA',
      description: 'Desenvolvimento de Single Page Applications (SPA) utilizando frameworks como Angular, React e Vue.js para criar experiências web fluidas e dinâmicas.'
    }
  ];

  ngAfterViewInit(): void {
    // Garante que o plugin está registrado
    gsap.registerPlugin(ScrollTrigger);

    // Pequeno atraso para garantir que todos os elementos foram renderizados
    setTimeout(() => this.setupPinnedAnimation(), 0);
  }

  // Método para alternar expansão do card
  toggleCardExpansion(index: number): void {
    console.log('Toggle card expansion called for index:', index);

    const card = this.serviceCards.toArray()[index]?.nativeElement;
    if (!card) {
      console.log('Card not found for index:', index);
      return;
    }

    const isExpanded = this.expandedCards.has(index);
    console.log('Card is currently expanded:', isExpanded);

    if (isExpanded) {
      // Colapsar card
      this.expandedCards.delete(index);
      console.log('Collapsing card');

      // Animar de volta para altura original (280px)
      gsap.to(card, {
        height: '280px',
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          // Após colapsar, restaurar overflow hidden
          card.style.overflow = 'hidden';
          card.style.zIndex = '2';
        }
      });

    } else {
      // Expandir card
      this.expandedCards.add(index);
      console.log('Expanding card');

      // Trazer card para frente imediatamente
      card.style.zIndex = '10';

      // Aguardar o Angular atualizar o DOM
      setTimeout(() => {
        const currentHeight = card.offsetHeight;

        // Remover overflow hidden temporariamente
        card.style.overflow = 'visible';

        // Temporariamente aplicar altura automática para medir
        card.style.height = 'auto';
        const autoHeight = card.offsetHeight;

        // Restaurar altura atual
        card.style.height = currentHeight + 'px';

        console.log('Current height:', currentHeight, 'Auto height:', autoHeight);

        // Animar para nova altura
        gsap.to(card, {
          height: autoHeight + 'px',
          duration: 0.4,
          ease: 'power2.inOut'
        });
      }, 50); // Aumentei o delay para garantir que o Angular atualize
    }

    console.log('Expanded cards:', Array.from(this.expandedCards));
  }

  // Verifica se card está expandido
  isCardExpanded(index: number): boolean {
    return this.expandedCards.has(index);
  }

  private setupPinnedAnimation(): void {
    // Usar SEMPRE o elemento #maintenance (seção pai) como trigger/pin
    const section = document.getElementById('maintenance');

    if (!section) {
      console.error('Seção #maintenance não encontrada!');
      return;
    }

    const title = this.maintenanceTitle.nativeElement;
    const gridEl = this.servicesGrid.nativeElement;
    const cards = this.serviceCards.map(ref => ref.nativeElement);

    console.log('Section element:', section);
    console.log('Cards found:', cards.length);

    // Aguardar um frame adicional
    requestAnimationFrame(() => {
      // Posicionar cards fora da tela (à direita)
      gsap.set(cards, {
        x: window.innerWidth + 200, // Começa bem fora da tela
        opacity: 0
      });

      // Reset título
      gsap.set(title, { opacity: 1, y: 0 });

      // Criar timeline com ScrollTrigger focando no pinning da seção completa
      this.tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`, // Mais tempo para ver todos os cards
          scrub: 1,
          pin: section, // Pina a seção inteira
          pinSpacing: true,
          markers: false, // Debug - remover depois
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => console.log('ScrollTrigger Progress:', self.progress)
        }
      });

      // Animar cada card entrando da direita para a esquerda sequencialmente
      cards.forEach((card, index) => {
        this.tl!.to(card, {
          x: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        }, index * 0.2); // Stagger entre os cards
      });

      // Forçar refresh do ScrollTrigger
      ScrollTrigger.refresh();
    });
  }

  ngOnDestroy(): void {
    // Limpa a timeline e o scrollTrigger para evitar memory leaks
    if (this.tl) {
      this.tl.scrollTrigger?.kill();
      this.tl.kill();
    }
  }
}
