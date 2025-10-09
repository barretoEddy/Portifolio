import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  private http = inject(HttpClient);
  private backendUrl = environment.backendUrl;
  private apiKey = environment.backendApiKey;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-backend-api-key': this.apiKey
    });
  }

  /**
   * Gerar conteúdo com Gemini AI
   * @param prompt - O texto do prompt para o Gemini
   * @param model - Modelo do Gemini (padrão: gemini-pro)
   */
  generateWithGemini(prompt: string, model = 'gemini-pro'): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/api/gemini/generate`,
      { prompt, model },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Buscar dados do Sanity com GROQ query
   * @param query - Query GROQ
   * @param params - Parâmetros opcionais da query
   */
  querySanity(query: string, params: Record<string, any> = {}): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/api/sanity/query`,
      { query, params },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Criar ou modificar documentos no Sanity
   * @param mutations - Array de mutations do Sanity
   */
  mutateSanity(mutations: any[]): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/api/sanity/mutate`,
      { mutations },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Testar conexão com o backend
   */
  testConnection(): Observable<any> {
    return this.http.get(`${this.backendUrl}/health`);
  }
}
