import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SupabaseService } from './services/supabase.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  async ngOnInit() {
    console.log('🚀 AppComponent: Inicializando aplicação...');

    try {
      // 1. Inicializar o sistema de autenticação do Supabase
      await this.supabaseService.initializeAuth();
      //console.log('✅ AppComponent: Sistema de autenticação inicializado');

      // 2. Aguardar um momento para sincronização
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Verificar estado final
      const isLoggedIn = this.authService.isLoggedIn();
      const isAdmin = this.authService.isAdmin();

      // console.log('📊 AppComponent: Estado final da inicialização:', {
      //   isLoggedIn,
      //   isAdmin,
      //   supabaseUser: !!this.supabaseService.getCurrentUser(),
      //   supabaseProfile: !!this.supabaseService.getCurrentProfile()
      // });

    } catch (error) {
      console.error('❌ AppComponent: Erro na inicialização:', error);
    }
  }
}
