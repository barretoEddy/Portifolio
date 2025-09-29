import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, map, switchMap, filter, take, timeout, delay, catchError, of, throwError } from 'rxjs';
import { SupabaseService, Profile } from '../services/supabase.service';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Interface compatibility - mantém compatibilidade com componentes existentes
export interface User {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    // Subscrever aos observables do SupabaseService - PERFIL
    this.supabaseService.currentProfile.subscribe(profile => {
      //console.log('🔄 AuthService: Perfil atualizado:', profile ? { id: profile.id, role: profile.role } : null);

      if (profile) {
        const user = this.mapProfileToUser(profile);
        this.currentUserSubject.next(user);
        //console.log('✅ AuthService: Usuário local atualizado:', { id: user.id, role: user.role, email: user.email });
      } else {
        this.currentUserSubject.next(null);
        //console.log('🧹 AuthService: Usuário local limpo');
      }
    });

    // NOVO: Também subscrever ao usuário do Supabase para detectar quando sessão é restaurada
    this.supabaseService.currentUser.subscribe(supabaseUser => {
      //console.log('🔄 AuthService: Usuário Supabase atualizado:', supabaseUser ? supabaseUser.email : null);

      if (supabaseUser && !this.currentUserSubject.value) {
        // Se temos usuário no Supabase mas não localmente, aguardar o perfil ser carregado
        //console.log('⏳ AuthService: Aguardando perfil ser carregado...');
      }
    });

    // Verificação inicial após construção (para casos de refresh)
    setTimeout(() => {
      this.initializeUserState();
    }, 100);
  }

  // Método para inicializar estado do usuário baseado no token
  private initializeUserState(): void {
    //console.log('🔄 AuthService: Inicializando estado do usuário...');

    const hasToken = this.hasValidSupabaseToken();
    const localUser = this.currentUserSubject.value;

    if (hasToken && !localUser) {
      //console.log('🔧 AuthService: Token válido encontrado, mas sem usuário local. Forçando sincronização...');

      // Tentar obter dados do Supabase
      const supabaseUser = this.supabaseService.getCurrentUser();
      const supabaseProfile = this.supabaseService.getCurrentProfile();

      if (supabaseProfile) {
        const user = this.mapProfileToUser(supabaseProfile);
        this.currentUserSubject.next(user);
        //console.log('✅ AuthService: Estado inicializado com perfil');
      } else if (supabaseUser) {
        const basicUser: User = {
          id: supabaseUser.id,
          fullName: supabaseUser.user_metadata?.['full_name'] || supabaseUser.email?.split('@')[0] || 'Usuário',
          email: supabaseUser.email || `${supabaseUser.id}@supabase.user`,
          company: supabaseUser.user_metadata?.['company'] || undefined,
          role: this.isEmailAdmin(supabaseUser.email) ? 'admin' : 'user',
          createdAt: new Date(supabaseUser.created_at || Date.now())
        };
        this.currentUserSubject.next(basicUser);
        //console.log('✅ AuthService: Estado inicializado com usuário básico');

        // IMPORTANTE: Forçar carregamento do perfil em background para corrigir role
        //console.log('🔄 AuthService: Forçando carregamento do perfil em background...');
        setTimeout(() => {
          this.supabaseService.initializeAuth().catch(error => {
            //console.error('❌ AuthService: Erro ao carregar perfil em background:', error);
          });
        }, 500);
      }
    }

    // NOVO: Verificar consistência para usuários já logados
    if (hasToken && localUser) {
      const supabaseProfile = this.supabaseService.getCurrentProfile();
      const isEmailAdmin = this.isEmailAdmin(localUser.email);

      console.log('🔍 AuthService: Verificando consistência admin:', {
        isEmailAdmin,
        profileRole: supabaseProfile?.role,
        localRole: localUser.role
      });

      if (isEmailAdmin && (!supabaseProfile || supabaseProfile.role !== 'admin')) {
        //console.log('⚠️ AuthService: Inconsistência admin detectada. Forçando sync...');
        setTimeout(() => {
          this.supabaseService.initializeAuth().catch(console.error);
        }, 200);
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Método para mapear Profile do Supabase para User local (compatibilidade)
  private mapProfileToUser(profile: Profile): User {
    const email = this.getCurrentUserEmail() || `${profile.id}@supabase.user`;

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: email,
      company: profile.company,
      role: profile.role,
      createdAt: new Date(profile.created_at)
    };
  }

  // Método para obter email do usuário atual do Supabase
  private getCurrentUserEmail(): string | null {
    const supabaseUser = this.supabaseService.getCurrentUser();
    return supabaseUser?.email || null;
  }

  login(email: string, password: string): Observable<User> {
    console.log('🔐 AuthService.login(): Iniciando login para:', email);

    return from(this.supabaseService.signIn(email, password)).pipe(
      switchMap(result => {
        // console.log('📧 AuthService.login(): Resposta do signIn:', {
        //   success: !result.error,
        //   error: result.error?.message
        // });

        if (result.error) {
          throw new Error(result.error.message || 'Email ou senha inválidos');
        }

        //console.log('⏳ AuthService.login(): Aguardando dados do usuário...');

        // Aguardar o perfil ser carregado com timeout e retry
        return this.currentUser.pipe(
          // Pequeno delay para permitir que o onAuthStateChange seja processado
          delay(100),
          filter(user => {
            //console.log('🔍 AuthService.login(): Verificando usuário atual:', user ? { id: user.id, email: user.email } : null);
            return user !== null;
          }),
          take(1), // Pegar apenas o primeiro valor válido
          timeout(15000), // Timeout de 15 segundos (aumentado)
          map(user => {
            // console.log('✅ AuthService.login(): Dados do usuário carregados:', {
            //   id: user!.id,
            //   email: user!.email,
            //   role: user!.role
            // });
            return user!;
          }),
          catchError(error => {
            console.error('❌ AuthService.login(): Timeout ao aguardar usuário:', error);

            // Tentativa de recuperação: forçar inicialização do SupabaseService
            //console.log('🔄 AuthService.login(): Tentando recuperação forçada...');

            return from(this.supabaseService.initializeAuth()).pipe(
              delay(1000), // Aguardar um pouco após a inicialização
              switchMap(() => {
                //console.log('🔍 AuthService.login(): Verificando estado após recuperação...');

                // Tentar obter o usuário novamente
                const currentUser = this.currentUserSubject.value;
                if (currentUser) {
                  //console.log('✅ AuthService.login(): Recuperação bem-sucedida:', currentUser.email);
                  return of(currentUser);
                }

                // Se ainda não tem usuário, tentar criar manualmente
                //console.log('🔧 AuthService.login(): Tentando criar usuário manualmente...');
                const supabaseUser = this.supabaseService.getCurrentUser();
                const supabaseProfile = this.supabaseService.getCurrentProfile();

                // console.log('📊 AuthService.login(): Estado do Supabase:', {
                //   hasUser: !!supabaseUser,
                //   hasProfile: !!supabaseProfile,
                //   userEmail: supabaseUser?.email
                // });

                if (supabaseProfile) {
                  const user = this.mapProfileToUser(supabaseProfile);
                  this.currentUserSubject.next(user);
                  //console.log('✅ AuthService.login(): Usuário criado a partir do perfil:', user.email);
                  return of(user);
                } else if (supabaseUser) {
                  const basicUser: User = {
                    id: supabaseUser.id,
                    fullName: supabaseUser.user_metadata?.['full_name'] || supabaseUser.email?.split('@')[0] || 'Usuário',
                    email: supabaseUser.email || `${supabaseUser.id}@supabase.user`,
                    company: supabaseUser.user_metadata?.['company'] || undefined,
                    role: this.isEmailAdmin(supabaseUser.email) ? 'admin' : 'user',
                    createdAt: new Date(supabaseUser.created_at || Date.now())
                  };

                  this.currentUserSubject.next(basicUser);
                  //console.log('✅ AuthService.login(): Usuário básico criado:', basicUser.email);

                  // Forçar carregamento do perfil em background
                  setTimeout(() => {
                    //console.log('🔄 AuthService.login(): Forçando carregamento de perfil em background...');
                    this.supabaseService.initializeAuth().catch(console.error);
                  }, 100);

                  return of(basicUser);
                }

                //console.error('❌ AuthService.login(): Falha total - sem dados do Supabase');
                return throwError(() => new Error('Erro ao carregar dados do usuário após login'));
              }),
              catchError(recoveryError => {
                //console.error('❌ AuthService.login(): Falha crítica na recuperação:', recoveryError);
                return throwError(() => new Error('Erro ao carregar dados do usuário'));
              })
            );
          })
        );
      })
    );
  }

  register(userData: {
    fullName: string;
    email: string;
    company?: string;
    password: string;
  }): Observable<User> {
    //console.log('📝 AuthService.register(): Iniciando registro para:', userData.email);

    return from(this.supabaseService.signUp(userData.email, userData.password, {
      full_name: userData.fullName,
      company: userData.company
    })).pipe(
      switchMap(result => {
        // console.log('📧 AuthService.register(): Resposta do signUp:', {
        //   success: !result.error,
        //   error: result.error?.message
        // });

        if (result.error) {
          throw new Error(result.error.message || 'Erro ao criar conta');
        }

        //console.log('⏳ AuthService.register(): Aguardando dados do usuário...');

        // Aguardar o perfil ser carregado com timeout
        return this.currentUser.pipe(
          filter(user => user !== null), // Filtrar apenas valores não-null
          take(1), // Pegar apenas o primeiro valor válido
          timeout(15000), // Timeout de 15 segundos (registro pode levar mais tempo)
          map(user => {
            // console.log('✅ AuthService.register(): Dados do usuário carregados:', {
            //   id: user!.id,
            //   email: user!.email,
            //   role: user!.role
            // });
            return user!;
          })
        );
      })
    );
  }

  logout(): void {
    //console.log('🚪 AuthService: Iniciando logout...');

    // Primeiro, limpar nosso estado local
    //console.log('🧹 AuthService: Limpando estado local...');
    this.currentUserSubject.next(null);

    // NOVO: Limpar tokens do Supabase ANTES do logout oficial
    //console.log('🗑️ AuthService: Limpando tokens do Supabase...');
    this.clearSupabaseTokens();

    // Depois, solicitar logout do Supabase (que já tem sua própria limpeza robusta)
    this.supabaseService.signOut().then(result => {
      if (result.error) {
        //console.error('⚠️ AuthService: Erro no logout do Supabase:', result.error);
      } else {
        //console.log('✅ AuthService: Logout do Supabase bem-sucedido');
      }

      // Garantir que nosso estado local esteja limpo (dupla verificação)
      this.currentUserSubject.next(null);

      // Limpar tokens novamente (dupla segurança)
      this.clearSupabaseTokens();

      // Limpeza adicional de dados legados (por compatibilidade)
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('users');
        localStorage.removeItem('contactMessages');
        //console.log('✅ AuthService: Dados legados removidos');
      } catch (error) {
        //console.warn('⚠️ AuthService: Erro ao remover dados legados:', error);
      }

      //console.log('✅ AuthService: Logout concluído');
    }).catch(error => {
      //console.error('❌ AuthService: Erro crítico no logout:', error);

      // Mesmo com erro, garantir que o estado local seja limpo
      this.currentUserSubject.next(null);

      // Limpar tokens mesmo com erro
      this.clearSupabaseTokens();

      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('users');
        localStorage.removeItem('contactMessages');
      } catch (cleanupError) {
        //console.warn('⚠️ AuthService: Erro na limpeza de emergência:', cleanupError);
      }
    });
  }

  // Novo método para limpar tokens do Supabase
  private clearSupabaseTokens(): void {
    try {
      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') && (key.includes('auth-token') || key.includes('session'))
      );

      let removedCount = 0;
      supabaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          removedCount++;
          //console.log(`🗑️ Token removido: ${key.substring(0, 20)}...`);
        } catch (error) {
          //console.warn(`⚠️ Erro ao remover token ${key}:`, error);
        }
      });

      if (removedCount > 0) {
        //console.log(`✅ ${removedCount} tokens do Supabase removidos`);
      } else {
        //console.log('ℹ️ Nenhum token do Supabase encontrado para remoção');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar tokens do Supabase:', error);
    }
  }

  isLoggedIn(): boolean {
    // 1. Verificar se existe token no localStorage
    const hasValidToken = this.hasValidSupabaseToken();

    // 2. Verificar estado local
    const localUser = this.currentUserSubject.value;
    const supabaseAuth = this.supabaseService.isAuthenticated();
    const supabaseUser = this.supabaseService.getCurrentUser();
    const supabaseProfile = this.supabaseService.getCurrentProfile();

    console.log('🔍 AuthService.isLoggedIn() check:', {
      hasValidToken,
      localUser: !!localUser,
      supabaseAuth: supabaseAuth,
      supabaseUser: !!supabaseUser,
      supabaseProfile: !!supabaseProfile
    });

    // 3. Se tem token válido mas não tem localUser, tentar criar um usuario local baseado no token
    if (hasValidToken && !localUser) {
      console.log('🔄 Token válido encontrado, mas localUser é null. Tentando recriar...');

      if (supabaseUser) {
        // Se temos usuário do Supabase mas sem perfil, criar um usuário básico
        const basicUser: User = {
          id: supabaseUser.id,
          fullName: supabaseUser.user_metadata?.['full_name'] || supabaseUser.email?.split('@')[0] || 'Usuário',
          email: supabaseUser.email || `${supabaseUser.id}@supabase.user`,
          company: supabaseUser.user_metadata?.['company'] || undefined,
          role: this.isEmailAdmin(supabaseUser.email) ? 'admin' : 'user',
          createdAt: new Date(supabaseUser.created_at || Date.now())
        };

        //console.log('✅ Criando usuário local baseado no Supabase:', basicUser);
        this.currentUserSubject.next(basicUser);
        return true;
      } else {
        // Se não temos nem usuário do Supabase, forçar re-inicialização
        //console.log('⚠️ Token válido mas sem usuário Supabase. Forçando inicialização...');
        this.supabaseService.initializeAuth().catch(console.error);
        return true; // Assumir logado baseado no token
      }
    }

    // 4. Se tem token válido, considerar logado (mesmo sem dados locais carregados)
    if (hasValidToken) {
      //console.log('✅ Token válido encontrado, usuário considerado logado');

      // Se Supabase tem perfil mas AuthService não, tentar sincronizar
      if (supabaseProfile && !localUser) {
        //console.log('🔄 AuthService: Sincronizando perfil encontrado...');
        try {
          const user = this.mapProfileToUser(supabaseProfile);
          this.currentUserSubject.next(user);
          //console.log('✅ AuthService: Perfil sincronizado com sucesso');
        } catch (error) {
          //console.error('❌ AuthService: Erro na sincronização:', error);
        }
      }

      return true;
    }

    // 5. Fallback para verificação tradicional
    return localUser !== null && supabaseAuth;
  }

  // Método para verificar se email é admin (mesmo do SupabaseService)
  private isEmailAdmin(email?: string): boolean {
    if (!email) return false;

    const adminEmails = [
      'eduard.mass@hotmail.com',
      'admin@example.com',
      'eduar@admin.com',
      'barretoEddy@admin.com'
    ];

    return adminEmails.includes(email.toLowerCase());
  }

  // Novo método para verificar token no localStorage
  private hasValidSupabaseToken(): boolean {
    try {
      // Procurar por keys do Supabase no localStorage
      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') && key.includes('auth-token')
      );

      if (supabaseKeys.length === 0) {
        //console.log('ℹ️ Nenhuma chave de auth do Supabase encontrada');
        return false;
      }

      // Verificar se algum token é válido
      for (const key of supabaseKeys) {
        try {
          const tokenData = localStorage.getItem(key);
          if (tokenData) {
            const parsed = JSON.parse(tokenData);

            // Verificar se tem access_token e não expirou
            if (parsed.access_token && parsed.expires_at) {
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = parsed.expires_at;

              if (expiresAt > now) {
                // console.log('✅ Token válido encontrado:', {
                //   key: key.substring(0, 20) + '...',
                //   expiresIn: Math.floor((expiresAt - now) / 60) + ' min'
                // });
                return true;
              } else {
                console.log('⚠️ Token expirado encontrado:', key.substring(0, 20) + '...');
              }
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Erro ao processar token:', key.substring(0, 20) + '...', parseError);
        }
      }

      console.log('❌ Nenhum token válido encontrado');
      return false;

    } catch (error) {
      console.error('❌ Erro ao verificar tokens:', error);
      return false;
    }
  }

  isAdmin(): boolean {
    const isLoggedIn = this.isLoggedIn();

    // Se não está logado, não é admin
    if (!isLoggedIn) {
      console.log('❌ AuthService.isAdmin(): Usuário não está logado');
      return false;
    }

    // Verificar diretamente pelo email se necessário
    const supabaseUser = this.supabaseService.getCurrentUser();
    const currentEmail = supabaseUser?.email?.toLowerCase();

    // Lista de emails admin (mesma do SupabaseService)
    const adminEmails = [
      'eduard.mass@hotmail.com',
      'admin@example.com',
      'eduar@admin.com',
      'barretoEddy@admin.com'
    ];

    const isEmailAdmin = currentEmail && adminEmails.includes(currentEmail);
    const isSupabaseAdmin = this.supabaseService.isAdmin();

    // console.log('👑 AuthService.isAdmin() check:', {
    //   isLoggedIn: isLoggedIn,
    //   currentEmail: currentEmail,
    //   isEmailAdmin: isEmailAdmin,
    //   isSupabaseAdmin: isSupabaseAdmin,
    //   result: isEmailAdmin || isSupabaseAdmin
    // });

    // Se o email é admin OU o Supabase diz que é admin, considerar admin
    return isEmailAdmin || isSupabaseAdmin;
  }

  hasAdminAccess(): boolean {
    const adminAccess = this.isLoggedIn() && this.isAdmin();
    //console.log('🛡️ AuthService.hasAdminAccess():', adminAccess);
    return adminAccess;
  }

  // Método para resetar senha (novo)
  resetPassword(email: string): Observable<boolean> {
    return from(this.supabaseService.resetPassword(email)).pipe(
      map(result => {
        if (result.error) {
          throw new Error(result.error.message || 'Erro ao resetar senha');
        }
        return true;
      })
    );
  }

  // Método para atualizar perfil (novo)
  updateProfile(updates: {
    fullName?: string;
    company?: string;
  }): Observable<User> {
    const profileUpdates: Partial<Profile> = {};

    if (updates.fullName) profileUpdates.full_name = updates.fullName;
    if (updates.company) profileUpdates.company = updates.company;

    return from(this.supabaseService.updateProfile(profileUpdates)).pipe(
      map(result => {
        if (result.error) {
          throw new Error(result.error.message || 'Erro ao atualizar perfil');
        }

        if (!result.data) {
          throw new Error('Erro ao atualizar perfil');
        }

        return this.mapProfileToUser(result.data);
      })
    );
  }

  // Compatibilidade com localStorage (para migração gradual) - OPCIONAL
  private migrateFromLocalStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && !this.isLoggedIn()) {
      // Se existe usuário no localStorage mas não no Supabase, limpar
      localStorage.removeItem('currentUser');
      localStorage.removeItem('users');
    }
  }
}
