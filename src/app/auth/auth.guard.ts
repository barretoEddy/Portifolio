import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, take, tap, switchMap, timeout, catchError } from 'rxjs/operators';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('🛡️ AuthGuard: Verificando acesso para:', state.url);

    // Retornar uma Promise para controle mais preciso
    return new Promise(async (resolve) => {
      try {
        // 1. Aguardar um momento para inicialização
        await new Promise(wait => setTimeout(wait, 200));

        // 2. Primeira verificação rápida com dados carregados
        const isLoggedIn = this.authService.isLoggedIn();
        const hasUser = !!this.authService.currentUserValue;

        console.log('🔍 AuthGuard: Verificação inicial:', {
          isLoggedIn,
          hasUser,
          url: state.url
        });

        if (isLoggedIn && hasUser) {
          console.log('✅ AuthGuard: Acesso imediato permitido');
          resolve(true);
          return;
        }

        // 3. Se não tem dados carregados mas parece estar logado, aguardar carregamento
        if (isLoggedIn && !hasUser) {
          console.log('⏳ AuthGuard: Aguardando carregamento dos dados do usuário...');

          // Aguardar até 3 segundos pelos dados do usuário
          let attempts = 0;
          const maxAttempts = 15; // 3 segundos (15 * 200ms)

          while (attempts < maxAttempts) {
            const currentUser = this.authService.currentUserValue;
            if (currentUser) {
              console.log('✅ AuthGuard: Dados do usuário carregados, permitindo acesso');
              resolve(true);
              return;
            }

            await new Promise(wait => setTimeout(wait, 200));
            attempts++;
          }

          console.log('⏰ AuthGuard: Timeout aguardando dados do usuário');
        }

        // 4. Verificação final via Supabase
        const isSessionValid = await this.supabaseService.isSessionValid();

        if (isSessionValid) {
          console.log('✅ AuthGuard: Sessão válida encontrada no Supabase');

          // Aguardar um momento para que AuthService sincronize
          await new Promise(wait => setTimeout(wait, 500));

          const userAfterSync = this.authService.currentUserValue;
          if (userAfterSync) {
            console.log('✅ AuthGuard: Dados sincronizados, permitindo acesso');
            resolve(true);
            return;
          }
        }

        // 5. Se chegou aqui, não está autenticado
        console.log('❌ AuthGuard: Acesso negado, redirecionando para login');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
          replaceUrl: true
        });
        resolve(false);

      } catch (error) {
        console.error('❌ AuthGuard: Erro durante verificação:', error);
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
          replaceUrl: true
        });
        resolve(false);
      }
    });
  }
}
