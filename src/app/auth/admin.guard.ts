import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, take, tap, switchMap, timeout, catchError } from 'rxjs/operators';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('👑 AdminGuard: Verificando acesso admin para:', state.url);

    // Retornar uma Promise que aguarda inicialização
    return new Promise(async (resolve) => {
      try {
        // 1. Aguardar um momento para inicialização (evita verificação muito rápida)
        await new Promise(wait => setTimeout(wait, 1000));

        // 2. Primeira verificação rápida
        const quickCheck = this.authService.isLoggedIn() && this.authService.isAdmin();
        if (quickCheck) {
          //console.log('✅ AdminGuard: Acesso admin imediato permitido');
          resolve(true);
          return;
        }

        console.log('🔄 AdminGuard: Verificação detalhada necessária...');

        // 3. Verificação direta mais eficiente
        const isLoggedIn = this.authService.isLoggedIn();
        const currentUser = this.authService.currentUserValue;
        const isAdmin = this.authService.isAdmin();

        console.log('🔍 AdminGuard: Estado após aguardar:', {
          isLoggedIn,
          hasUser: !!currentUser,
          isAdmin,
          userRole: currentUser?.role
        });

        // Se tem usuário e é admin, permitir acesso
        if (isLoggedIn && currentUser && isAdmin) {
          console.log('✅ AdminGuard: Acesso admin imediato permitido');
          resolve(true);
          return;
        }

        // Se tem usuário mas não é admin, redirecionar para área do usuário
        if (isLoggedIn && currentUser && !isAdmin) {
          console.log('⚠️ AdminGuard: Usuário logado mas não é admin, redirecionando');
          this.router.navigate(['/protected-contact'], { replaceUrl: true });
          resolve(false);
          return;
        }

        // 4. Verificação final via Supabase se não tem dados locais
        const isSessionValid = await this.supabaseService.isSessionValid();

        if (isSessionValid) {
          console.log('🔄 AdminGuard: Sessão válida encontrada, aguardando sincronização...');

          // Aguardar sincronização dos dados
          let attempts = 0;
          const maxAttempts = 10; // 2 segundos

          while (attempts < maxAttempts) {
            const syncedUser = this.authService.currentUserValue;
            const syncedAdmin = this.authService.isAdmin();

            if (syncedUser) {
              console.log('📊 AdminGuard: Dados sincronizados:', {
                hasUser: true,
                isAdmin: syncedAdmin,
                userRole: syncedUser.role
              });

              if (syncedAdmin) {
                console.log('✅ AdminGuard: Acesso admin permitido após sincronização');
                resolve(true);
                return;
              } else {
                console.log('⚠️ AdminGuard: Não é admin após sincronização');
                this.router.navigate(['/protected-contact'], { replaceUrl: true });
                resolve(false);
                return;
              }
            }

            await new Promise(wait => setTimeout(wait, 200));
            attempts++;
          }
        }

        // 5. Se chegou aqui, redirecionar para login
        console.log('❌ AdminGuard: Acesso negado, redirecionando para login');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url, adminAccess: true },
          replaceUrl: true
        });
        resolve(false);

      } catch (error) {
        //console.error('❌ AdminGuard: Erro crítico:', error);
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url, adminAccess: true },
          replaceUrl: true
        });
        resolve(false);
      }
    });
  }
}
