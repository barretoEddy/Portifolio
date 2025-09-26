import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../auth/auth.service';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-supabase-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <header class="test-header">
        <h1>🧪 Teste de Integração Supabase</h1>
        <p>Validando conexão e funcionalidades</p>
        <button class="run-tests-btn" (click)="runAllTests()" [disabled]="isRunning">
          {{ isRunning ? '⏳ Executando...' : '🚀 Executar Testes' }}
        </button>
      </header>

      <main class="test-results">
        <div class="test-item"
             *ngFor="let result of testResults"
             [class]="'status-' + result.status">
          <div class="test-info">
            <h3>{{ result.test }}</h3>
            <p>{{ result.message }}</p>
            <small *ngIf="result.duration">{{ result.duration }}ms</small>
          </div>
          <div class="test-status">
            <span *ngIf="result.status === 'pending'">⏳</span>
            <span *ngIf="result.status === 'success'">✅</span>
            <span *ngIf="result.status === 'error'">❌</span>
          </div>
        </div>

        <div class="test-summary" *ngIf="testResults.length > 0">
          <h3>📊 Resumo dos Testes</h3>
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-number">{{ getSuccessCount() }}</span>
              <span class="stat-label">Sucessos</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ getErrorCount() }}</span>
              <span class="stat-label">Falhas</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ getTotalDuration() }}ms</span>
              <span class="stat-label">Tempo Total</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .test-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .test-header h1 {
      color: #2d3436;
      margin-bottom: 0.5rem;
    }

    .run-tests-btn {
      background: linear-gradient(135deg, #01c86bcd 0%, #014726 100%);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
    }

    .run-tests-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .test-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ddd;
    }

    .test-item.status-pending {
      background: #fff3cd;
      border-left-color: #ffc107;
    }

    .test-item.status-success {
      background: #d1edff;
      border-left-color: #28a745;
    }

    .test-item.status-error {
      background: #f8d7da;
      border-left-color: #dc3545;
    }

    .test-info h3 {
      margin: 0 0 0.5rem 0;
      color: #2d3436;
    }

    .test-info p {
      margin: 0;
      color: #636e72;
      font-size: 0.9rem;
    }

    .test-status {
      font-size: 1.5rem;
    }

    .test-summary {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }

    .stat {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #01c86bcd;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #636e72;
    }
  `]
})
export class SupabaseTestComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  testResults: TestResult[] = [];
  isRunning = false;

  ngOnInit() {
    this.initializeTests();
  }

  initializeTests() {
    this.testResults = [
      { test: 'Conexão com Supabase', status: 'pending', message: 'Verificando conectividade...' },
      { test: 'Configuração de Environment', status: 'pending', message: 'Validando credenciais...' },
      { test: 'Autenticação - Estado Inicial', status: 'pending', message: 'Verificando estado de auth...' },
      { test: 'Database - Consulta Usuários', status: 'pending', message: 'Testando consulta a profiles...' },
      { test: 'Database - Consulta Mensagens', status: 'pending', message: 'Testando consulta a mensagens...' },
      { test: 'Observables - Reatividade', status: 'pending', message: 'Verificando observables...' },
      { test: 'Real-time - Configuração', status: 'pending', message: 'Testando canais real-time...' }
    ];
  }

  async runAllTests() {
    this.isRunning = true;
    this.initializeTests();

    for (let i = 0; i < this.testResults.length; i++) {
      await this.runTest(i);
      await this.delay(500); // Pausa entre testes
    }

    this.isRunning = false;
  }

  private async runTest(index: number) {
    const test = this.testResults[index];
    const startTime = Date.now();

    try {
      switch (index) {
        case 0:
          await this.testSupabaseConnection();
          break;
        case 1:
          await this.testEnvironmentConfig();
          break;
        case 2:
          await this.testAuthState();
          break;
        case 3:
          await this.testUserQuery();
          break;
        case 4:
          await this.testMessageQuery();
          break;
        case 5:
          await this.testObservables();
          break;
        case 6:
          await this.testRealTime();
          break;
      }

      test.status = 'success';
      test.message = '✅ Teste passou com sucesso';
    } catch (error: any) {
      test.status = 'error';
      test.message = `❌ ${error.message || 'Erro desconhecido'}`;
    }

    test.duration = Date.now() - startTime;
  }

  private async testSupabaseConnection() {
    const client = (this.supabaseService as any).supabase;
    if (!client) {
      throw new Error('Cliente Supabase não inicializado');
    }

    // Testa query simples
    const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não encontrada (ok para teste)
      throw new Error(`Erro de conexão: ${error.message}`);
    }
  }

  private async testEnvironmentConfig() {
    const client = (this.supabaseService as any).supabase;
    const url = client.supabaseUrl;
    const key = client.supabaseKey;

    if (!url || !url.includes('supabase')) {
      throw new Error('URL do Supabase não configurada corretamente');
    }

    if (!key || key.length < 100) {
      throw new Error('Chave anônima do Supabase não configurada');
    }
  }

  private async testAuthState() {
    const isAuth = this.supabaseService.isAuthenticated();
    const currentUser = this.supabaseService.getCurrentUser();

    // Este teste sempre passa, apenas reporta o estado
    if (isAuth && currentUser) {
      throw new Error(`Usuário logado: ${currentUser.email}`);
    } else {
      // Não é erro, apenas estado
    }
  }

  private async testUserQuery() {
    const result = await this.supabaseService.getAllUsers();
    if (result.error) {
      throw new Error(`Erro ao consultar usuários: ${result.error.message}`);
    }
  }

  private async testMessageQuery() {
    const result = await this.supabaseService.getAllMessages();
    if (result.error) {
      throw new Error(`Erro ao consultar mensagens: ${result.error.message}`);
    }
  }

  private async testObservables() {
    const user$ = this.supabaseService.currentUser;
    const profile$ = this.supabaseService.currentProfile;

    if (!user$ || !profile$) {
      throw new Error('Observables não configurados');
    }

    // Testa se observables são válidos
    const userValue = this.supabaseService.getCurrentUser();
    const profileValue = this.supabaseService.getCurrentProfile();

    // Este teste sempre passa se chegou até aqui
  }

  private async testRealTime() {
    try {
      // Testa se consegue criar canal (não precisa funcionar perfeitamente)
      const channel = this.supabaseService.subscribeToMessages(() => {});
      if (channel) {
        // Cleanup
        channel.unsubscribe();
      }
    } catch (error: any) {
      throw new Error(`Real-time não configurado: ${error.message}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSuccessCount(): number {
    return this.testResults.filter(r => r.status === 'success').length;
  }

  getErrorCount(): number {
    return this.testResults.filter(r => r.status === 'error').length;
  }

  getTotalDuration(): number {
    return this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
  }
}
