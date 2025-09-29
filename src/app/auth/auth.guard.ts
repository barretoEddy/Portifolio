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
  ): Observable<boolean> | boolean {
    console.log('🛡️ AuthGuard: Verificando acesso para:', state.url);

    // 1. Primeira verificação rápida
    const quickCheck = this.authService.isLoggedIn() && this.authService.currentUserValue;
    if (quickCheck) {
      //console.log('✅ AuthGuard: Acesso imediato permitido (usuário já carregado)');
      return true;
    }

    console.log('🔄 AuthGuard: Verificação detalhada necessária...');

    // 2. Verificação detalhada com observable
    return this.supabaseService.currentUser.pipe(
      // Aguardar até 5 segundos pela resposta
      timeout(5000),
      // Pegar apenas o primeiro valor emitido
      take(1),
      // Verificar se temos um usuário válido
      switchMap(async (user) => {
        console.log('👤 AuthGuard: Usuário do Supabase:', user ? user.id : 'null');

        if (!user) {
          console.log('❌ AuthGuard: Nenhum usuário encontrado');
          return false;
        }

        // Verificar se a sessão ainda é válida
        try {
          const { data: { session }, error } = await this.supabaseService['supabase'].auth.getSession();

          if (error || !session) {
            //console.log('❌ AuthGuard: Sessão inválida ou expirada', error);
            return false;
          }

          //console.log('✅ AuthGuard: Sessão válida encontrada');
          return true;
        } catch (error) {
          //console.error('❌ AuthGuard: Erro ao verificar sessão:', error);
          return false;
        }
      }),
      // Mapear o resultado para boolean
      map((isAuthenticated: boolean) => {
        if (isAuthenticated) {
          //console.log('✅ AuthGuard: Acesso permitido para:', state.url);
          return true;
        } else {
          //console.log('❌ AuthGuard: Acesso negado, redirecionando para login');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
            replaceUrl: true
          });
          return false;
        }
      }),
      // Em caso de erro ou timeout
      catchError((error) => {
        //console.error('❌ AuthGuard: Erro durante verificação:', error);

        // Se deu timeout, assumir que não está autenticado
        if (error.name === 'TimeoutError') {
          //console.log('⏰ AuthGuard: Timeout na verificação, negando acesso');
        }

        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
          replaceUrl: true
        });
        return of(false);
      })
    );
  }
}
