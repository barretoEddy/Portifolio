import { Injectable } from '@angular/core';
import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url'; // Importando o image URL builder

// Definindo uma interface para o tipo de projeto para ter um código mais seguro
export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: any; // O tipo de imagem do Sanity é complexo, 'any' é suficiente por agora
  description: string;
  technologies: string[];
  liveUrl?: string;
  repoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SanityService {
  private client: SanityClient;
  private builder: any;

  constructor() {
    this.client = createClient({
      projectId: 'qacw4twj', // Mantenha o seu Project ID lembre-se da data tambem
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-05-20',
    });

    // 2. Inicialize o builder com o seu cliente
    this.builder = imageUrlBuilder(this.client);
  }

  // A função para buscar os projetos agora retorna uma Promise do tipo Project[]
  async getProjects(): Promise<Project[]> {
    return this.client.fetch('*[_type == "project"]');
  }

  // 3. Nova função para construir a URL da imagem a partir dos dados do Sanity
  getImageUrl(source: any) {
    return this.builder.image(source);
  }
}
