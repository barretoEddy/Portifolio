import { Component, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, text, onScroll,  } from 'animejs';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseX: number; // Base position for attraction/repulsion
  baseY: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
  <canvas #backgroundCanvas id="backgroundCanvas"></canvas>
  <h2>Hero Section</h2>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements AfterViewInit {
  @ViewChild('backgroundCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
 private particles: Particle[] = [];
  private mouse: { x: number | null, y: number | null, radius: number } = { x: null, y: null, radius: 150 }; // Mouse interaction area  private handleMouseMove!: (event: MouseEvent) => void; // Declare the property

  private numberOfParticles = 100; // You can adjust this
  private ctx!: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
 // Define the bound mousemove handler
 this.handleMouseMove = this.handleMouseMove.bind(this);
    const canvas = this.canvasRef.nativeElement;
    canvas.style.display = 'block'; // Remove default canvas margin
    this.ctx = canvas.getContext('2d')!;

    this.resizeCanvas();
    this.animate();

    // Animate title and subtitle
    this.animateText();

    // Apply neon effect class
    const heroSection = this.canvasRef.nativeElement.parentElement;
    if (heroSection) heroSection.classList.add('neon-effect');

    window.addEventListener('resize', () => this.resizeCanvas());
 window.addEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.createParticles(); // Recreate particles on resize
  }

  animateText(): void {
    (animate as any)({
      targets: ['h1', 'h2'], // Target the h1 and h2 elements
      opacity: [0, 1], // Animate opacity from 0 to 1
      duration: 2000, // Animation duration in milliseconds
      easing: 'easeInOutQuad' // Easing function
    });
  }
  createParticles(): void {
    this.particles = [];
    const canvas = this.canvasRef.nativeElement;
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1, // Random velocity
        vy: (Math.random() - 0.5) * 1, // Random velocity
        size: Math.random() * 3 + 0.5, // Random size
        baseX: Math.random() * canvas.width, // Base position for attraction/repulsion
        baseY: Math.random() * canvas.height,
      });
    }
  }

  // Handle particle movement and drawing
  updateAndDrawParticles(): void {
    const canvas = this.canvasRef.nativeElement;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      // Attraction/Repulsion from mouse
      this.handleMouseInteraction(particle);

      // Update position
      this.updateParticlePosition(particle, canvas);

      // Draw particle
      this.drawParticle(particle);
    }
  }

  animate(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height); // Clear canvas

    this.particles.forEach(particle => {
      this.drawParticle(particle);
      // Update particle position (we'll add boundary checks later)
      particle.x += particle.vx;
      particle.y += particle.vy;
    });

    // Update particle positions and handle mouse interaction
    this.updateAndDrawParticles();

    // Draw connections between all particles
    this.particles.forEach(particle => {
      this.drawConnections(particle);
    });

    requestAnimationFrame(() => this.animate());
  }

  // Draw a single particle
  drawParticle(particle: Particle): void {
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff'; // White color for particles
    this.ctx.fill();
    this.ctx.closePath();
  }

 // Draw lines between nearby particles
  drawConnections(particle: Particle): void {
 for (let i = 0; i < this.particles.length; i++) {
 const p1 = this.particles[i];
 for (let j = i + 1; j < this.particles.length; j++) {
 const p2 = this.particles[j];
 const distance = Math.sqrt(
 Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
      );

      if (distance < 100) { // Draw a line if particles are close enough (adjust threshold)
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`; // Fading line color based on distance
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
        this.ctx.stroke();
        this.ctx.closePath();
      }
      }
    }
  }

  // Update particle position with boundary checks
  updateParticlePosition(particle: Particle, canvas: HTMLCanvasElement): void {
    particle.x += particle.vx;
    particle.y += particle.vy;
    // Implement boundary checks here (e.g., wrap around or bounce)
    // For now, particles just move off screen
  }

  // Handle mouse interaction (attraction/repulsion)
  handleMouseInteraction(particle: Particle): void {
    if (this.mouse.x !== null && this.mouse.y !== null) {
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.mouse.radius) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxForce = 10; // Adjust force strength
        const force = (this.mouse.radius - distance) / this.mouse.radius * maxForce;
        const directionX = forceDirectionX * force;
        const directionY = forceDirectionY * force;

        particle.x -= directionX; // Repel
        particle.y -= directionY;
      }
    }
  }

  ngOnDestroy(): void {
    // Clean up event listeners when the component is destroyed
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
 window.removeEventListener('mousemove', this.handleMouseMove); // Use the bound function
  }
}
