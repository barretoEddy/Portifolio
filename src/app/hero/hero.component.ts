import { Component, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticleAnimationService } from '../services/particle-animation.service'; // Ajuste o caminho

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  providers: [ParticleAnimationService],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css', // Corrigido para .css
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('backgroundCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private animationService: ParticleAnimationService) {}

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.animationService.updateMousePosition(event);
  }

  ngAfterViewInit(): void {
    this.animationService.init(this.canvasRef);
  }

  ngOnDestroy(): void {
    this.animationService.destroy();
  }
}
