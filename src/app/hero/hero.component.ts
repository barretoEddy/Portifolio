import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeDKeyboardService } from '../services/three-d-keyboard.service'; // Importamos o novo serviço

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
  // O serviço já é 'providedIn: root', não precisamos de o fornecer aqui
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  // Pegamos a referência do canvas do template
  @ViewChild('webglCanvas', { static: true }) 
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  // Injetamos o serviço
  private threeDService = inject(ThreeDKeyboardService);

  ngAfterViewInit(): void {
    // Passamos o canvas para o serviço para que ele possa criar a cena 3D
    this.threeDService.createScene(this.canvasRef);
  }

  ngOnDestroy(): void {
    // Chamamos o método de limpeza do serviço
    this.threeDService.ngOnDestroy();
  }

  // Adicionamos listeners para redimensionar a cena e seguir o rato
  @HostListener('window:resize')
  onResize() {
    this.threeDService.resize();
  }
  
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.threeDService.updateMousePosition(event);
  }
}