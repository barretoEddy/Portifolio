import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

@Component({
  selector: 'app-title',
  standalone: true,
  imports: [],
  templateUrl: './title.component.html',
  styleUrl: './title.component.css'
})
export class TitleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('titleSection') titleSection!: ElementRef;
  @ViewChild('particleCanvas') particleCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrame?: number;
  private mouseX = 0;
  private mouseY = 0;
  private isMouseInSection = false;
  private canvasWidth = 0;
  private canvasHeight = 0;

  private readonly PARTICLE_COUNT = 150;
  private readonly COLORS = [
    'rgba(100, 255, 218, 0.8)',  // Primary accent
    'rgba(136, 146, 176, 0.6)',  // Secondary
    'rgba(204, 214, 246, 0.4)',  // Text color
    'rgba(100, 255, 218, 0.3)'   // Accent variant
  ];

  ngOnInit() {
    this.setupEventListeners();
  }

  ngAfterViewInit() {
    this.setupCanvas();
    this.initializeParticles();
    this.startAnimation();
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }

  private setupEventListeners() {
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.titleSection) return;

    const rect = this.titleSection.nativeElement.getBoundingClientRect();
    this.isMouseInSection = e.clientX >= rect.left && 
                           e.clientX <= rect.right && 
                           e.clientY >= rect.top && 
                           e.clientY <= rect.bottom;

    if (this.isMouseInSection) {
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    }
  };

  private handleResize = () => {
    this.setupCanvas();
  };

  private setupCanvas() {
    if (!this.particleCanvas) return;

    const canvas = this.particleCanvas.nativeElement;
    const rect = this.titleSection.nativeElement.getBoundingClientRect();
    
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    
    this.ctx = canvas.getContext('2d')!;
  }

  private initializeParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const maxLife = 300 + Math.random() * 200;
    return {
      x: Math.random() * this.canvasWidth,
      y: Math.random() * this.canvasHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.5,
      life: 0,
      maxLife: maxLife,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)]
    };
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life++;

      // Mouse interaction
      if (this.isMouseInSection) {
        const dx = this.mouseX - particle.x;
        const dy = this.mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          particle.vx += dx * force * 0.001;
          particle.vy += dy * force * 0.001;
          particle.opacity = Math.min(1, particle.opacity + force * 0.02);
        }
      }

      // Boundary collision
      if (particle.x < 0 || particle.x > this.canvasWidth) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(this.canvasWidth, particle.x));
      }
      if (particle.y < 0 || particle.y > this.canvasHeight) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(this.canvasHeight, particle.y));
      }

      // Fade based on life
      const lifeFactor = 1 - (particle.life / particle.maxLife);
      particle.opacity *= 0.998; // Gradual fade

      // Remove dead particles and replace
      if (particle.life >= particle.maxLife || particle.opacity < 0.01) {
        this.particles[i] = this.createParticle();
      }
    }
  }

  private drawParticles() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw connections between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const particle1 = this.particles[i];
        const particle2 = this.particles[j];
        
        const dx = particle1.x - particle2.x;
        const dy = particle1.y - particle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80) {
          const opacity = (80 - distance) / 80 * 0.1;
          this.ctx.strokeStyle = `rgba(100, 255, 218, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle1.x, particle1.y);
          this.ctx.lineTo(particle2.x, particle2.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const particle of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }

    // Draw mouse interaction area
    if (this.isMouseInSection) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillStyle = 'rgba(100, 255, 218, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(this.mouseX, this.mouseY, 100, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private animate = () => {
    this.updateParticles();
    this.drawParticles();
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private startAnimation() {
    this.animate();
  }
}
