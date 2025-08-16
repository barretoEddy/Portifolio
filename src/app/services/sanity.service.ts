import { Injectable } from '@angular/core';
import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Interface para o Projeto
export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: any;
  description: string;
  technologies: string[];
  liveUrl?: string;
  repoUrl?: string;
}

// Interface para o Post do Blog
export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: any;
  excerpt: string;
  publishedAt: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class SanityService {
  private client: SanityClient;
  private builder: any;

  constructor() {
    this.client = createClient({
      projectId: 'qacw4twj', // MANTENHA O SEU PROJECT ID CORRETO
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-05-20',
    });
    this.builder = imageUrlBuilder(this.client);
  }

  // --- MÉTODOS PARA PROJETOS ---
  async getProjects(): Promise<Project[]> {
    return this.client.fetch('*[_type == "project"]');
  }

  // --- MÉTODOS PARA O BLOG (AGORA COMPLETOS) ---

  // Busca todos os posts, ordenados pelo mais recente
  async getPosts(): Promise<Post[]> {
    const query = '*[_type == "post"] | order(publishedAt desc)';
    return this.client.fetch(query);
  }

  // Busca um único post pelo seu slug
  async getPostBySlug(slug: string): Promise<Post> {
    const query = '*[_type == "post" && slug.current == $slug][0]';
    return this.client.fetch(query, { slug });
  }

  // --- MÉTODOS UTILITÁRIOS ---
  getImageUrl(source: any) {
    return this.builder.image(source);
  }
}
