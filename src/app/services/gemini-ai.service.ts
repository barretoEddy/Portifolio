import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

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
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {}

  async generatePost(request: PostGenerationRequest): Promise<GeneratedPost> {
    try {
      const prompt = this.buildPrompt(request);

      console.log('🔍 Testando URL da API:', this.apiUrl);
      console.log('🔍 API Key (primeiros 10 chars):', environment.geminiApiKey?.substring(0, 10) + '...');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': environment.geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Error response body:', errorText);
        throw new Error(`Erro da API: ${response.status} - ${errorText}`);
      }      const data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Resposta inválida da API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      return this.parseGeneratedContent(generatedText);

    } catch (error) {
      console.error('Erro ao gerar post com Gemini:', error);
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
9. Inclua exemplos de codigo se aplicável utilizando aspas triplas para blocos de código

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
      console.error('Erro ao fazer parse do conteúdo gerado:', error);
      console.log('Conteúdo recebido:', content);

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

  // Método auxiliar para testar a conexão
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': environment.geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Teste de conexão. Responda apenas: OK'
            }]
          }]
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Método para testar diferentes URLs/modelos disponíveis
  async findWorkingModel(): Promise<string | null> {
    const modelsToTest = [
      'gemini-2.0-flash',           // ← Mais novo e funcionando
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',                 // ← Descontinuado
      'gemini-1.0-pro-latest'
    ];

    console.log('🔍 Testando modelos disponíveis...');

    for (const model of modelsToTest) {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        console.log(`🔍 Testando: ${model}`);

        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': environment.geminiApiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Teste'
              }]
            }]
          })
        });

        console.log(`🔍 ${model}: Status ${response.status}`);

        if (response.ok) {
          console.log(`✅ Modelo funcionando: ${model}`);
          return model;
        }
      } catch (error) {
        console.log(`❌ ${model}: Erro de conexão`);
      }
    }

    return null;
  }
}
