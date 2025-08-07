import { Component, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import anime from 'animejs';
 
@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cabin-container">
      <h2>Experiência em Cabine - O Copiloto Inteligente</h2>
      <div class="digital-dashboard">
        <div #mapArea class="map-area">Map Placeholder</div>
        <div #musicPlayer class="music-player">Music Player Placeholder</div>
        <div class="lighting-borders"></div> <!-- Placeholder for lighting effects -->
      </div>
      <div class="mode-buttons">
        <button #travelModeButton class="mode-button" (click)="activateTravelMode()">Modo Viagem</button>
        <button #urbanModeButton class="mode-button" (click)="activateUrbanMode()">Modo Urbano</button>
      </div>
    </div>
  `,
  styles: [
    // Component styles will be in src/app/cabin/cabin.component.css
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinComponent implements AfterViewInit {
  @ViewChild('mapArea') mapArea!: ElementRef;
  @ViewChild('musicPlayer') musicPlayer!: ElementRef;
  @ViewChild('travelModeButton') travelModeButton!: ElementRef;
  @ViewChild('urbanModeButton') urbanModeButton!: ElementRef;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // No click listeners needed with Angular's (click) binding
  }

  activateTravelMode(): void {
    (anime as any)({
      targets: this.mapArea.nativeElement,
      width: '80%', // Example animation
      duration: 800,
      easing: 'easeInOutQuad'
    });
    // Add other animations for music player, lighting, etc.
  }

  activateUrbanMode(): void {
    (anime as any)({
      targets: this.mapArea.nativeElement,
      width: '50%', // Example animation
      duration: 800,
      easing: 'easeInOutQuad'
    });
    // Add other animations for music player, lighting, etc.
  }
}