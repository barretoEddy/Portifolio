import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SanityService, Project } from '../services/sanity.service'; // Importa o serviço e a interface que vai fazer todo o trabalho pesado

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perception.component.html',
  styleUrl: './perception.component.css'
})
export class PerceptionComponent implements OnInit {
  // Injeta o serviço de uma forma moderna
  private sanityService = inject(SanityService);

  // Propriedades para guardar os projetos e o estado de carregamento
  projects: Project[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.fetchProjects(); // Chama a função para buscar os projetos quando o componente é inicializado
  }

  async fetchProjects(): Promise<void> {
    this.isLoading = true; // Inicia o carregamento
    this.projects = await this.sanityService.getProjects();
    this.isLoading = false; // Termina o carregamento
    console.log('Projetos carregados do Sanity:', this.projects);
  }

  // Função que será usada no template para obter a URL da imagem
  getProjectImageUrl(source: any) {
    return this.sanityService.getImageUrl(source).width(800).url();
  }

}
