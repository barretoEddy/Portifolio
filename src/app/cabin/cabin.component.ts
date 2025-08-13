import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cabin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabin.component.html',
  styleUrl: './cabin.component.css'
})
export class CabinComponent {
  // Nenhuma lógica de animação aqui pq foi migrado para o app component
}
