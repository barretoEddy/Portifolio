import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiAiService, PostGenerationRequest, GeneratedPost } from '../../services/gemini-ai.service';
import { SanityService } from '../../services/sanity.service';

@Component({
  selector: 'app-ai-post-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-generator-container">
      <div class="generator-header">
        <h3>
          <span class="ai-icon">🤖</span>
          Gerador de Posts com IA
        </h3>
        <p class="generator-subtitle">Crie conteúdo automático usando Google Gemini</p>
      </div>

      <!-- Formulário de Configuração -->
      <form class="generator-form" (ngSubmit)="generatePost()" [class.generating]="isGenerating">
        <div class="form-row">
          <div class="form-group">
            <label for="topic">Tópico do Post *</label>
            <input
              id="topic"
              type="text"
              [(ngModel)]="request.topic"
              name="topic"
              placeholder="Ex: Como usar Angular com IA"
              required
              [disabled]="isGenerating">
          </div>

          <div class="form-group">
            <label for="category">Categoria</label>
            <input
              id="category"
              type="text"
              [(ngModel)]="request.category"
              name="category"
              placeholder="Ex: Tecnologia, Desenvolvimento"
              [disabled]="isGenerating">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="tone">Tom do Conteúdo</label>
            <select id="tone" [(ngModel)]="request.tone" name="tone" [disabled]="isGenerating">
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="friendly">Amigável</option>
              <option value="technical">Técnico</option>
            </select>
          </div>

          <div class="form-group">
            <label for="length">Tamanho do Post</label>
            <select id="length" [(ngModel)]="request.length" name="length" [disabled]="isGenerating">
              <option value="short">Curto (300-500 palavras)</option>
              <option value="medium">Médio (600-1000 palavras)</option>
              <option value="long">Longo (1200-2000 palavras)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="keywords">Palavras-chave (separadas por vírgula)</label>
          <input
            id="keywords"
            type="text"
            [(ngModel)]="keywordsString"
            name="keywords"
            placeholder="angular, typescript, desenvolvimento, frontend"
            [disabled]="isGenerating">
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="test-btn"
            (click)="testGeminiConnection()"
            [disabled]="isGenerating || isTesting">
            <span class="btn-icon" [class.spinning]="isTesting">
              {{ isTesting ? '⏳' : '🔍' }}
            </span>
            {{ isTesting ? 'Testando...' : 'Testar Conexão' }}
          </button>

          <button
            type="submit"
            class="generate-btn"
            [disabled]="!request.topic || isGenerating || isTesting">
            <span class="btn-icon" [class.spinning]="isGenerating">
              {{ isGenerating ? '⏳' : '✨' }}
            </span>
            {{ isGenerating ? 'Gerando...' : 'Gerar Post com IA' }}
          </button>
        </div>
      </form>

      <!-- Resultado -->
      <div class="result-section" *ngIf="generatedPost || error || testResult">
        <!-- Test Result -->
        <div class="test-result" *ngIf="testResult && !error">
          <div class="success-message" *ngIf="testResult.success">
            <span class="success-icon">✅</span>
            <p>Conexão com Gemini funcionando!</p>
            <p class="test-details">Modelo: {{ testResult.model }}</p>
          </div>

          <div class="error-message" *ngIf="!testResult.success">
            <span class="error-icon">❌</span>
            <p>Erro na conexão: {{ testResult.error }}</p>
            <p class="test-details">Verifique sua API key</p>
          </div>
        </div>

        <!-- Erro -->
        <div class="error-message" *ngIf="error">
          <span class="error-icon">❌</span>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="clearError()">Tentar Novamente</button>
        </div>

        <!-- Post Gerado -->
        <div class="generated-result" *ngIf="generatedPost && !error">
          <div class="result-header">
            <h4>Post Gerado com Sucesso! 🎉</h4>
            <div class="result-actions">
              <div class="save-actions">
                <button class="action-btn save-btn primary" (click)="saveAndEditInStudio()" [disabled]="isSaving">
                  {{ isSaving ? 'Salvando...' : '� Salvar e Editar no Studio' }}
                </button>
                <button class="action-btn save-btn secondary" (click)="saveToSanity()" [disabled]="isSaving">
                  {{ isSaving ? 'Salvando...' : '📝 Apenas Salvar' }}
                </button>
              </div>
              <div class="other-actions">
                <button class="action-btn copy-btn" (click)="copyToClipboard()">
                  📋 Copiar
                </button>
                <button class="action-btn clear-btn" (click)="clearResult()">
                  🗑️ Limpar
                </button>
              </div>
            </div>
          </div>

          <div class="result-content">
            <div class="field-preview">
              <label>Título:</label>
              <h3 class="post-title">{{ generatedPost.title }}</h3>
            </div>

            <div class="field-preview">
              <label>Slug:</label>
              <code class="post-slug">{{ generatedPost.slug }}</code>
            </div>

            <div class="field-preview">
              <label>Resumo:</label>
              <p class="post-excerpt">{{ generatedPost.excerpt }}</p>
            </div>

            <div class="field-preview">
              <label>Palavras-chave sugeridas:</label>
              <div class="keywords-tags">
                <span class="keyword-tag" *ngFor="let keyword of generatedPost.suggestedKeywords">
                  {{ keyword }}
                </span>
              </div>
            </div>

            <div class="field-preview body-preview">
              <label>Conteúdo (Markdown):</label>
              <pre class="post-body">{{ generatedPost.body }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-generator-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 24px;
      margin-bottom: 24px;
    }

    .generator-header {
      margin-bottom: 24px;
      text-align: center;
    }

    .generator-header h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .ai-icon {
      font-size: 1.75rem;
    }

    .generator-subtitle {
      color: #6b7280;
      margin: 0;
    }

    .generator-form {
      margin-bottom: 32px;
    }

    .generator-form.generating {
      opacity: 0.7;
      pointer-events: none;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
      font-size: 0.875rem;
    }

    .form-group input,
    .form-group select {
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
    }

    .form-group input:disabled,
    .form-group select:disabled {
      background: #f9fafb;
      cursor: not-allowed;
    }

    .form-actions {
      text-align: center;
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .test-btn {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
      justify-content: center;
    }

    .generate-btn {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
      justify-content: center;
    }

    .test-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgb(245 158 11 / 0.3);
    }

    .generate-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgb(59 130 246 / 0.3);
    }

    .test-btn:disabled,
    .generate-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .result-section {
      border-top: 2px solid #f3f4f6;
      padding-top: 24px;
    }

    .test-result {
      margin-bottom: 20px;
    }

    .success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .success-icon {
      font-size: 1.5rem;
      margin-bottom: 8px;
      display: block;
    }

    .success-message p {
      color: #16a34a;
      margin: 8px 0;
      font-weight: 500;
    }

    .test-details {
      font-size: 0.875rem;
      color: #065f46 !important;
      margin-top: 4px !important;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .error-icon {
      font-size: 1.5rem;
      margin-bottom: 8px;
      display: block;
    }

    .error-message p {
      color: #dc2626;
      margin: 8px 0;
      font-weight: 500;
    }

    .retry-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .generated-result {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .result-header h4 {
      color: #059669;
      margin: 0;
      font-size: 1.25rem;
    }

    .result-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .save-btn {
      background: #059669;
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      background: #047857;
    }

    .save-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .copy-btn {
      background: #3b82f6;
      color: white;
    }

    .copy-btn:hover {
      background: #2563eb;
    }

    .clear-btn {
      background: #ef4444;
      color: white;
    }

    .clear-btn:hover {
      background: #dc2626;
    }

    .result-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field-preview label {
      font-weight: 700;
      color: #374151;
      font-size: 0.875rem;
      display: block;
      margin-bottom: 8px;
    }

    .post-title {
      color: #1f2937;
      margin: 0;
      font-size: 1.25rem;
    }

    .post-slug {
      background: #1f2937;
      color: #10b981;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .post-excerpt {
      color: #4b5563;
      margin: 0;
      line-height: 1.6;
    }

    .keywords-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .keyword-tag {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .body-preview {
      max-height: 400px;
      overflow-y: auto;
    }

    .post-body {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    @media (max-width: 768px) {
      .result-header {
        flex-direction: column;
        align-items: stretch;
      }

      .result-actions,
      .form-actions {
        justify-content: center;
      }
    }
  `]
})
export class AiPostGeneratorComponent {
  private geminiService = inject(GeminiAiService);
  private sanityService = inject(SanityService);

  request: PostGenerationRequest = {
    topic: '',
    tone: 'friendly',
    length: 'medium',
    category: '',
    keywords: [],
    language: 'pt-BR'
  };

  keywordsString = '';
  isGenerating = false;
  isTesting = false;
  isSaving = false;
  generatedPost: GeneratedPost | null = null;
  error: string | null = null;
  testResult: { success: boolean; model?: string; error?: string } | null = null;

  async testGeminiConnection() {
    this.isTesting = true;
    this.error = null;
    this.testResult = null;

    try {
      console.log('🔍 Iniciando teste de conexão...');

      // Primeiro tenta encontrar um modelo que funciona
      const workingModel = await this.geminiService.findWorkingModel();

      if (workingModel) {
        this.testResult = {
          success: true,
          model: workingModel
        };
      } else {
        this.testResult = {
          success: false,
          error: 'Nenhum modelo Gemini disponível encontrado'
        };
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      this.testResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      this.isTesting = false;
    }
  }

  async generatePost() {
    if (!this.request.topic.trim()) {
      this.error = 'Por favor, insira um tópico para gerar o post.';
      return;
    }

    this.isGenerating = true;
    this.error = null;
    this.generatedPost = null;
    this.testResult = null;

    try {
      // Processar keywords
      this.request.keywords = this.keywordsString
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Gerar post
      this.generatedPost = await this.geminiService.generatePost(this.request);

    } catch (error) {
      console.error('Erro ao gerar post:', error);
      this.error = error instanceof Error ? error.message : 'Erro desconhecido ao gerar o post';
    } finally {
      this.isGenerating = false;
    }
  }

  async saveAndEditInStudio() {
    if (!this.generatedPost) return;

    this.isSaving = true;
    try {
      // Verificar conexão com Sanity
      const isConnected = await this.sanityService.testConnection();
      if (!isConnected) {
        throw new Error('Não foi possível conectar ao Sanity. Verifique as configurações.');
      }

      // Salvar post no Sanity
      const result = await this.sanityService.createPostFromAI(this.generatedPost);

      console.log('Post salvo no Sanity:', result);

      // Redirecionar automaticamente para o Sanity Studio
      const studioUrl = `https://eddy-portfolio.sanity.studio/structure/posts;${result._id}`;
      window.open(studioUrl, '_blank');

      // Mostrar confirmação de sucesso
      alert(
        `✅ Post "${this.generatedPost.title}" salvo com sucesso!\n\n` +
        `🚀 Sanity Studio foi aberto em nova aba para edição final.\n\n` +
        `📝 Lá você pode:\n` +
        `• Ajustar título e conteúdo\n` +
        `• Adicionar imagens e mídia\n` +
        `• Configurar SEO e metadados\n` +
        `• Definir status (draft/published)\n` +
        `• Agendar publicação\n\n` +
        `💡 Dica: Mantenha esta aba aberta para gerar mais posts!`
      );

      // Limpar formulário após sucesso
      this.clearResult();
      this.clearForm();

    } catch (error) {
      console.error('Erro ao salvar no Sanity:', error);

      let errorMessage = 'Erro ao salvar no Sanity.';
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }

      if (error instanceof Error && error.message.includes('token')) {
        errorMessage += '\n\n💡 Dica: Verifique se o token de escrita do Sanity está configurado corretamente no service.';
      }

      alert(errorMessage);
    } finally {
      this.isSaving = false;
    }
  }

  async saveToSanity() {
    if (!this.generatedPost) return;

    this.isSaving = true;
    try {
      // Verificar conexão com Sanity
      const isConnected = await this.sanityService.testConnection();
      if (!isConnected) {
        throw new Error('Não foi possível conectar ao Sanity. Verifique as configurações.');
      }

      // Salvar post no Sanity
      const result = await this.sanityService.createPostFromAI(this.generatedPost);

      console.log('Post salvo no Sanity:', result);

      // Mostrar confirmação simples
      alert(`✅ Post "${this.generatedPost.title}" salvo no Sanity com sucesso!`);


      // Limpar formulário após sucesso
      this.clearResult();
      this.clearForm();

    } catch (error) {
      console.error('Erro ao salvar no Sanity:', error);

      let errorMessage = 'Erro ao salvar no Sanity.';
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }

      if (error instanceof Error && error.message.includes('token')) {
        errorMessage += '\n\n💡 Dica: Verifique se o token de escrita do Sanity está configurado corretamente no service.';
      }

      alert(errorMessage);
    } finally {
      this.isSaving = false;
    }
  }

  copyToClipboard() {
    if (!this.generatedPost) return;

    const content = `# ${this.generatedPost.title}

**Slug:** ${this.generatedPost.slug}

**Resumo:** ${this.generatedPost.excerpt}

**Palavras-chave:** ${this.generatedPost.suggestedKeywords.join(', ')}

---

${this.generatedPost.body}`;

    navigator.clipboard.writeText(content).then(() => {
      alert('Conteúdo copiado para a área de transferência! 📋');
    }).catch(() => {
      alert('Erro ao copiar. Tente manualmente.');
    });
  }

  clearResult() {
    this.generatedPost = null;
    this.error = null;
    this.testResult = null;
  }

  clearError() {
    this.error = null;
  }

  clearForm() {
    this.request = {
      topic: '',
      tone: 'friendly',
      length: 'medium',
      category: '',
      keywords: [],
      language: 'pt-BR'
    };
    this.keywordsString = '';
  }
}
