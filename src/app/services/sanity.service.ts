import { Injectable, inject } from '@angular/core';
import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { GeneratedPost } from './gemini-ai.service';
import { BackendApiService } from './backend-api.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

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

// Interface para criar novo post
export interface CreatePostRequest {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  keywords?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SanityService {
  private client: SanityClient;
  private builder: any;
  private backendApi = inject(BackendApiService);

  constructor() {
    // Cliente Sanity APENAS para leitura (sem token)
    this.client = createClient({
      projectId: environment.sanity?.projectId || 'qacw4twj',
      dataset: environment.sanity?.dataset || 'production',
      useCdn: environment.sanity?.useCdn ?? true,
      apiVersion: environment.sanity?.apiVersion || '2024-05-20',
      // ⚠️ SEM TOKEN! Operações de escrita via backend
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

  // ⚡ ATUALIZADO: Criar novo post via BACKEND (seguro)
  async createPostFromAI(generatedPost: GeneratedPost): Promise<any> {
    try {
      const doc = {
        _type: 'post',
        title: generatedPost.title,
        slug: {
          _type: 'slug',
          current: generatedPost.slug
        },
        excerpt: generatedPost.excerpt,
        body: generatedPost.body,
        publishedAt: new Date().toISOString(),
        // mainImage pode ser adicionado posteriormente
        // keywords podem ser armazenadas em um campo customizado se necessário
      };

      // ⚡ Usar backend para criar documento (mutation)
      const mutations = [{ create: doc }];
      const result = await firstValueFrom(this.backendApi.mutateSanity(mutations));

      console.log('Post criado no Sanity via backend:', result);
      return result;

    } catch (error) {
      console.error('Erro ao criar post no Sanity:', error);
      throw new Error('Falha ao salvar post no Sanity');
    }
  }

  // ✅ Verificar slug continua sendo leitura (pode usar client local)
  async checkSlugExists(slug: string): Promise<boolean> {
    const query = '*[_type == "post" && slug.current == $slug]';
    const results = await this.client.fetch(query, { slug });
    return results.length > 0;
  }

  // Gerar slug único se necessário
  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.checkSlugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // ⚡ ATUALIZADO: Criar post via BACKEND (seguro)
  async createPost(request: CreatePostRequest): Promise<any> {
    try {
      // Verificar e gerar slug único se necessário
      const uniqueSlug = await this.generateUniqueSlug(request.slug);

      const doc = {
        _type: 'post',
        title: request.title,
        slug: {
          _type: 'slug',
          current: uniqueSlug
        },
        excerpt: request.excerpt,
        body: request.body,
        publishedAt: new Date().toISOString()
      };

      // ⚡ Usar backend para criar documento
      const mutations = [{ create: doc }];
      const result = await firstValueFrom(this.backendApi.mutateSanity(mutations));
      return result;

    } catch (error) {
      console.error('Erro ao criar post:', error);
      throw error;
    }
  }

  // Testar conexão com Sanity
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.fetch('*[_type == "post"][0..0]');
      return Array.isArray(result);
    } catch (error) {
      console.error('Erro ao conectar com Sanity:', error);
      return false;
    }
  }

  // --- MÉTODOS UTILITÁRIOS ---
  getImageUrl(source: any) {
    return this.builder.image(source);
  }
}
