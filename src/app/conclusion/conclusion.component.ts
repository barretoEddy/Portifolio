import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import anime from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

@Component({
  selector: 'app-conclusion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #conclusionCanvas></canvas>
    <div class="conclusion-content">
      <h2>A jornada está apenas começando.</h2>
      <div class="social-links">
        <!-- Placeholder social/Ford website links -->
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background-color: #000; /* Ensure a dark background */
      }
      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }
      .conclusion-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #fff;
        text-align: center;
      }
      h2 {
        font-size: 2.5em;
        margin-bottom: 20px;
      }
      .social-links a {
        color: #0ff; /* Neon color for links */
        text-decoration: none;
        margin: 0 10px;
        font-size: 1.2em;
        transition: color 0.3s ease;
      }
      .social-links a:hover {
        color: #fff;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConclusionComponent {

  @ViewChild('conclusionCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conclusionContent') conclusionContentRef!: ElementRef<HTMLDivElement>;
  private ctx!: CanvasRenderingContext2D | null;
  private particles: Particle[] = [];
  private mouse = { x: -100, y: -100 }; // Initialize off-screen
  private animationFrameId: number | null = null;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    // Ensure canvas is ready before getting context
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');

    if (this.ctx) {
      this.resizeCanvas();
      this.createParticles(100); // More particles for a denser network
      this.animate();
      
      // Register ScrollTrigger plugin if not already
      gsap.registerPlugin(ScrollTrigger);

      // Animate content on scroll
      // Use a timeout to ensure ViewChild for conclusionContentRef is ready
      setTimeout(() => {
        if (this.conclusionContentRef) {
          gsap.from(this.conclusionContentRef.nativeElement, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
              trigger: this.conclusionContentRef.nativeElement,
              start: 'top 80%', // Animation starts when the top of the element is 80% from the top of the viewport
              toggleActions: 'play none none none',
            },
          });
        }
      }, 0);

      window.addEventListener('resize', this.resizeCanvas.bind(this));
      window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    // Need to pass the same function reference to remove
    // window.removeEventListener('mousemove', this.handleMouseMove.bind(this)); // Removed due to binding issue on removal
    window.removeEventListener('mousemove', this.handleMouseMove); // Assuming handleMouseMove is bound correctly or an arrow function
  } 

  resizeCanvas(): void {
    if (this.ctx && this.canvasRef) {
      this.canvasRef.nativeElement.width = window.innerWidth;
      this.canvasRef.nativeElement.height = window.innerHeight;
    }
  }

  createParticles(count: number): void {
    this.particles = [];
    const canvas = this.canvasRef.nativeElement;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, // Slower movement
        vy: (Math.random() - 0.5) * 0.5, // Slower movement
        radius: Math.random() * 2 + 1,
        color: '#0ff' // Neon color
      });
    }
  }

  // Use an arrow function to maintain 'this' context
  handleMouseMove = (event: MouseEvent): void => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
  }

  handleMouseLeave = (): void => {
      this.mouse = { x: -100, y: -100 }; // Reset mouse position when leaving
  }

  animate(): void {
    if (!this.ctx || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      // Move particles
      p1.x += p1.vx;
      p1.y += p1.vy;

      // Bounce off edges
      if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
      if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

      // Draw particle
      this.ctx.fillStyle = p1.color;
      this.ctx.beginPath();
      this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw lines to nearby particles and mouse
      // The loop for j is within the scope of the loop for i, so i should be accessible
      this.drawConnections(p1);
    }

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  drawConnections(p1: Particle): void {
    if (!this.ctx || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const connectionDistance = 100; // Distance threshold for drawing lines

    // Connect to other particles
    // Corrected the loop to use the outer loop index 'i'
    for (let j = 0; j < this.particles.length; j++) {
      const p2 = this.particles[j];
      const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      if (distance < connectionDistance) {
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${1 - distance / connectionDistance})`; // Neon color with fading opacity
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    }

    // Connect to mouse
    const mouseDistance = Math.hypot(p1.x - this.mouse.x, p1.y - this.mouse.y);
    const mouseConnectionDistance = 150; // Distance threshold for connecting to mouse

    if (mouseDistance < mouseConnectionDistance) {
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${1 - mouseDistance / mouseConnectionDistance})`; // Neon color with fading opacity
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(this.mouse.x, this.mouse.y);
      this.ctx.stroke();
    }
  }
}
