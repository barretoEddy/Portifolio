// src/app/cabin/cabin.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevealOnScrollDirective } from '../directives/reveal-on-scroll.directive'; // Importe a diretiva
import { GsapRevealDirective } from '../directives/gsap-reveal.directive';

@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule, GsapRevealDirective], // Adicione aqui
  templateUrl: './cabin.component.html',
  styleUrl: './cabin.component.css'
})
export class CabinComponent {}
