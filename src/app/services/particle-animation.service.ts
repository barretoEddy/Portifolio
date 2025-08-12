import { Injectable, ElementRef, NgZone } from '@angular/core';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number;
}

@Injectable() // Não precisa de providedIn: 'root' pois será fornecido pelo componente
export class ParticleAnimationService {
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId?: number;
  private mouse = { x: 0, y: 0, radius: 100 };
  private canvas!: HTMLCanvasElement;

  constructor(private ngZone: NgZone) {}

  public init(canvasRef: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvasRef.nativeElement;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Contexto 2D indisponível.');
    this.ctx = context;
    this.resizeCanvas();
    this.createParticles();
    this.startAnimation();
    window.addEventListener('resize', this.onResize);
  }

  public destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
  }

  public updateMousePosition(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  }

  private onResize = () => this.resizeCanvas();

  private resizeCanvas(): void {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.createParticles();
  }

  private createParticles(): void {
    this.particles = [];
    const numberOfParticles = Math.floor((this.canvas.width * this.canvas.height) / 10000);
    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.5 + 0.5,
      });
    }
  }

  private startAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.draw();
        this.animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    });
  }

  private draw(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
        this.handleMouseInteraction(p);
        this.updateParticlePosition(p);
        this.drawParticle(p);
    });
    this.drawConnections();
  }

  private drawParticle(p: Particle): void {
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(100, 255, 218, 0.7)';
    this.ctx.fill();
  }

  private updateParticlePosition(p: Particle): void {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
  }

  private handleMouseInteraction(p: Particle): void {
    const dx = this.mouse.x - p.x;
    const dy = this.mouse.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const repelForce = 1.5;

    if (distance < this.mouse.radius) {
        p.x -= (dx / distance) * repelForce * (1 - distance / this.mouse.radius);
        p.y -= (dy / distance) * repelForce * (1 - distance / this.mouse.radius);
    }
  }

  private drawConnections(): void {
    let opacity;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i; j < this.particles.length; j++) {
        const distance = Math.sqrt(
          Math.pow(this.particles[i].x - this.particles[j].x, 2) +
          Math.pow(this.particles[i].y - this.particles[j].y, 2)
        );

        if (distance < 120) {
          opacity = 1 - (distance / 120);
          this.ctx.strokeStyle = `rgba(100, 255, 218, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }
}
