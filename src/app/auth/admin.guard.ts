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

        // 3. Verificação detalhada com observable
        this.supabaseService.currentUser.pipe(
          // Aguardar até 5 segundos pela resposta
          timeout(5000),
          // Pegar apenas o primeiro valor emitido
          take(1),
          // Verificar se temos um usuário válido e se é admin
          switchMap(async (user) => {
            //console.log('👤 AdminGuard: Usuário do Supabase:', user ? user.id : 'null');

            if (!user) {
              //console.log('❌ AdminGuard: Nenhum usuário encontrado');
              return { isAuthenticated: false, isAdmin: false };
            }

            // Verificar se a sessão ainda é válida
            try {
              const isSessionValid = await this.supabaseService.isSessionValid();
              if (!isSessionValid) {
                //console.log('❌ AdminGuard: Sessão inválida');
                return { isAuthenticated: false, isAdmin: false };
              }

              const isAdmin = this.supabaseService.isAdmin();
              //console.log('🔍 AdminGuard: Status do usuário:', { isAuthenticated: true, isAdmin });

              return { isAuthenticated: true, isAdmin };
            } catch (error) {
              //console.error('❌ AdminGuard: Erro ao verificar sessão:', error);
              return { isAuthenticated: false, isAdmin: false };
            }
          }),
          // Mapear o resultado para boolean
          map(({ isAuthenticated, isAdmin }) => {
            if (isAuthenticated && isAdmin) {
              //console.log('✅ AdminGuard: Acesso admin permitido para:', state.url);
              return true;
            } else if (isAuthenticated && !isAdmin) {
              //console.log('⚠️ AdminGuard: Usuário logado mas não é admin, redirecionando');
              this.router.navigate(['/protected-contact'], { replaceUrl: true });
              return false;
            } else {
              //console.log('❌ AdminGuard: Usuário não autenticado, redirecionando para login');
              this.router.navigate(['/login'], {
                queryParams: { returnUrl: state.url, adminAccess: true },
                replaceUrl: true
              });
              return false;
            }
          }),
          // Em caso de erro ou timeout
          catchError((error) => {
            //console.error('❌ AdminGuard: Erro durante verificação:', error);

            // Se deu timeout, assumir que não está autenticado
            if (error.name === 'TimeoutError') {
              //console.log('⏰ AdminGuard: Timeout na verificação, negando acesso');
            }

            this.router.navigate(['/login'], {
              queryParams: { returnUrl: state.url, adminAccess: true },
              replaceUrl: true
            });
            return of(false);
          })
        ).subscribe(result => resolve(result));

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
