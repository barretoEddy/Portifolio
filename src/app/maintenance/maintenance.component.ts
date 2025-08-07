import { ChangeDetectionStrategy, Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-container">
      <h2>Maintenance Preditiva - O Sexto Sentido</h2>
      <div class="car-wireframe">
        <!-- Placeholder for car parts -->
        <div class="car-part engine"></div>
        <div class="car-part battery"></div>
        <div class="car-part tires"></div>
      </div>
      <div class="ai-brain"></div>
      <!-- Placeholder for data particles -->
      <div class="data-particle particle-1"></div>
      <div class="data-particle particle-2"></div>
      <div class="data-particle particle-3"></div>

      <div class="anomaly-alert battery-alert"></div>

      <div class="explanation-text">
        <p>Alerta: Detectada anomalia na célula 3 da bateria. Agendamento de manutenção recomendado.</p>
        <p>A IA analisa dados dos sensores do carro para prever falhas antes que aconteçam, otimizando a manutenção.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .maintenance-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #000; /* Example background */
        color: #fff;
        padding: 50px 20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceComponent implements AfterViewInit {
  @ViewChild('maintenanceContainer') container!: ElementRef;

  ngAfterViewInit(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.maintenance-container',
        start: 'top center', // Animation starts when the top of the trigger hits the center of the viewport
        end: 'bottom center', // Animation ends when the bottom of the trigger hits the center of the viewport
        scrub: true, // Link animation progress to scroll position
        // markers: true, // Uncomment for visual debugging
      },
    });

    // Initial state (optional, can be set in CSS)
    tl.set('.car-wireframe, .ai-brain, .data-particle, .anomaly-alert, .explanation-text', { opacity: 0 });

    // Animation sequence
    tl.to('.car-wireframe', { opacity: 1, duration: 1 }) // Wireframe appears
      .to('.data-particle', {
        opacity: 1, // Data particles appear
        motionPath: {
          path: [ // Example path - you'll need to define actual paths based on your layout
            { x: 0, y: 0 },
            { x: 100, y: -50 },
            { x: 200, y: 0 },
          ],
          curviness: 1.25,
          autoRotate: true,
        },
        duration: 2,
        stagger: 0.2,
      }, "-=0.5") // Staggered animation for particles
      .to('.ai-brain', { opacity: 1, duration: 0.5 }) // AI brain appears
      .to('.anomaly-alert', { opacity: 1, duration: 0.5, repeat: 3, yoyo: true }) // Anomaly alert flashes
      .to('.explanation-text', { opacity: 1, duration: 1 }); // Explanation text appears
  }
}