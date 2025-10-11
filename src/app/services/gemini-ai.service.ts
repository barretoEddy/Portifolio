import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { BackendApiService } from './backend-api.service';
import { firstValueFrom } from 'rxjs';

export interface PostGenerationRequest {
  topic: string;
  tone: 'formal' | 'casual' | 'technical' | 'friendly';
  length: 'short' | 'medium' | 'long';
  category?: string;
  keywords?: string[];
  language?: 'pt-BR' | 'en';
}

export interface GeneratedPost {
  title: string;
  excerpt: string;
  body: string;
  slug: string;
  suggestedKeywords: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAiService {
  private backendApi = inject(BackendApiService);

  constructor() {}

  async generatePost(request: PostGenerationRequest): Promise<GeneratedPost> {
    try {
      const prompt = this.buildPrompt(request);

      // ⚡ USAR BACKEND em vez de chamar Gemini diretamente
      const data = await firstValueFrom(
        this.backendApi.generateWithGemini(prompt, 'gemini-2.0-flash')
      );

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Resposta inválida da API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      return this.parseGeneratedContent(generatedText);

    } catch (error) {
      console.error('Erro ao gerar post:', error);
      throw new Error('Falha ao gerar conteúdo. Tente novamente.');
    }
  }

  private buildPrompt(request: PostGenerationRequest): string {
    const languageInstructions = request.language === 'pt-BR'
      ? 'Responda em português brasileiro'
      : 'Respond in English';

    const lengthGuide = {
      short: '300-500 palavras',
      medium: '600-1000 palavras',
      long: '1200-2000 palavras'
    };

    const toneGuide = {
      formal: 'tom formal e profissional',
      casual: 'tom casual e conversacional',
      technical: 'tom técnico e detalhado',
      friendly: 'tom amigável e acessível'
    };

    let prompt = `${languageInstructions}.

Crie um post completo para blog sobre o tópico: "${request.topic}"

Especificações:
- Tom: ${toneGuide[request.tone]}
- Tamanho: ${lengthGuide[request.length]}
- Categoria: ${request.category || 'Geral'}`;

    if (request.keywords && request.keywords.length > 0) {
      prompt += `
- Palavras-chave a incluir: ${request.keywords.join(', ')}`;
    }

    prompt += `

Formato de resposta obrigatório (use exatamente este formato JSON):
{
  "title": "Título atrativo do post",
  "excerpt": "Resumo de 2-3 linhas do conteúdo",
  "body": "Conteúdo completo em markdown com parágrafos, títulos e formatação adequada",
  "slug": "titulo-do-post-em-kebab-case",
  "suggestedKeywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"]
}

Requisitos importantes:
1. O body deve estar em markdown válido
2. Use ## para subtítulos, **negrito**, *itálico*
3. Inclua listas quando apropriado
4. Mantenha parágrafos bem estruturados
5. O slug deve ser SEO-friendly
6. As palavras-chave sugeridas devem ser relevantes e específicas
7. O conteúdo deve ser original e envolvente
8. Inclua exemplos práticos quando relevante
9. Inclua exemplos de código se aplicável utilizando aspas triplas com a linguagem especificada (ex: \`\`\`javascript, \`\`\`typescript, \`\`\`html, \`\`\`css, \`\`\`json, \`\`\`bash)

Exemplo de bloco de código no markdown:
\`\`\`javascript
const express = require('express');
const app = express();
\`\`\`

IMPORTANTE: SEMPRE especifique a linguagem após as aspas triplas para ativar o syntax highlighting!

Responda APENAS com o JSON, sem texto adicional antes ou depois.`;

    return prompt;
  }

  private parseGeneratedContent(content: string): GeneratedPost {
    try {
      // Remove possível markdown code block
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();

      const parsed = JSON.parse(cleanContent);

      // Validar campos obrigatórios
      if (!parsed.title || !parsed.body || !parsed.excerpt) {
        throw new Error('Campos obrigatórios ausentes na resposta');
      }

      // Gerar slug se não fornecido
      if (!parsed.slug) {
        parsed.slug = this.generateSlug(parsed.title);
      }

      // Garantir que suggestedKeywords é array
      if (!Array.isArray(parsed.suggestedKeywords)) {
        parsed.suggestedKeywords = [];
      }

      return {
        title: parsed.title,
        excerpt: parsed.excerpt,
        body: parsed.body,
        slug: parsed.slug,
        suggestedKeywords: parsed.suggestedKeywords
      };

    } catch (error) {
      // Fallback: tentar extrair manualmente
      return this.extractContentManually(content);
    }
  }

  private extractContentManually(content: string): GeneratedPost {
    // Fallback simples se o JSON parsing falhar
    const lines = content.split('\n').filter(line => line.trim());
    const title = lines.find(line => line.includes('title'))?.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim() || 'Post Gerado por IA';

    return {
      title,
      excerpt: 'Conteúdo gerado por IA. Edite conforme necessário.',
      body: content,
      slug: this.generateSlug(title),
      suggestedKeywords: ['ia', 'conteudo', 'blog']
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // ⚡ ATUALIZADO: Testar conexão via backend
  async testConnection(): Promise<boolean> {
    try {
      const result = await firstValueFrom(this.backendApi.testConnection());
      return result.status === 'ok';
    } catch {
      return false;
    }
  }

  // ❌ REMOVIDO: Este método fazia chamadas diretas ao Gemini (inseguro)
  // Agora usamos apenas o backend que já sabe qual modelo funciona
  async findWorkingModel(): Promise<string | null> {
    // Sempre retorna o modelo que sabemos que funciona
    return 'gemini-2.0-flash';
  }
}
