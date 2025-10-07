import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces TypeScript para type safety
export interface Profile {
  id: string;
  full_name: string;
  company?: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  project_type?: string;
  budget?: string;
  deadline?: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Para joins
}

export interface DatabaseResult<T> {
  data: T | null;
  error: any;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Observables para estado da aplicação
  private _currentUser = new BehaviorSubject<User | null>(null);
  private _currentProfile = new BehaviorSubject<Profile | null>(null);
  private _session = new BehaviorSubject<Session | null>(null);

  public currentUser = this._currentUser.asObservable();
  public currentProfile = this._currentProfile.asObservable();
  public session = this._session.asObservable();

  constructor() {
    // Limpar locks órfãos antes de inicializar
    this.clearOrphanedLocks();

    // Inicializar cliente Supabase com configurações otimizadas
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Implementar lock customizado que sempre permite aquisição
          lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
            // Implementação que ignora locks e executa diretamente
            // Isso evita conflitos de NavigatorLockManager
            try {
              return await fn();
            } catch (error) {
              console.warn('Erro no lock customizado:', error);
              throw error;
            }
          },
          // Configurar storage customizado com tratamento de erros
          storage: {
            getItem: (key: string) => {
              try {
                return localStorage.getItem(key);
              } catch {
                return null;
              }
            },
            setItem: (key: string, value: string) => {
              try {
                localStorage.setItem(key, value);
              } catch {
                // Silenciosamente ignorar erros de storage
              }
            },
            removeItem: (key: string) => {
              try {
                localStorage.removeItem(key);
              } catch {
                // Silenciosamente ignorar erros de storage
              }
            }
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-angular'
          }
        }
      }
    );

    // Escutar mudanças de autenticação com error handling
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        this._session.next(session);

        if (session?.user) {
          this._currentUser.next(session.user);
          await this.loadCurrentProfile();
        } else {
          this._currentUser.next(null);
          this._currentProfile.next(null);
        }
      } catch (error: any) {
        // console.error('Erro no onAuthStateChange:', error);

        // Se for erro de lock, tentar limpar e recarregar
        if (error.message?.includes('lock') || error.name === 'NavigatorLockAcquireTimeoutError') {
          this.clearOrphanedLocks();
          setTimeout(() => this.checkSession(), 2000);
        }
      }
    });

    // Verificar se já existe uma sessão
    this.checkSession();
  }

  // Método para limpar locks órfãos que podem causar conflitos
  private clearOrphanedLocks(): void {
    try {
      // 1. Limpar keys relacionadas a locks do Supabase
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') || 
        key.includes('supabase.auth.token') ||
        key.includes('auth-token')
      );

      authKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Se o token expirou há mais de 1 hora, remover
            if (parsed.expires_at && (Date.now() / 1000) > (parsed.expires_at + 3600)) {
              localStorage.removeItem(key);
              // console.log(`Removido token expirado: ${key}`);
            }
          }
        } catch (e) {
          // Se não conseguir fazer parse, remover o key problemático
          localStorage.removeItem(key);
          // console.log(`Removido key problemático: ${key}`);
        }
      });

      // 2. Tentar liberar locks ativos do Navigator (se disponível)
      if ('locks' in navigator && typeof (navigator as any).locks?.query === 'function') {
        (navigator as any).locks.query().then((locks: any) => {
          if (locks && locks.held && locks.held.length > 0) {
            // console.log('🔒 Locks ativos detectados:', locks.held.map((l: any) => l.name));
            // Infelizmente não podemos forçar release de locks de outras abas
            // mas podemos logar para debug
          }
        }).catch(() => {
          // Silenciosamente ignorar se locks API não estiver disponível
        });
      }
    } catch (error) {
      // console.warn('Erro ao limpar locks órfãos:', error);
    }
  }

  // Método utilitário para retry em operações que podem dar timeout
  private async retryAuthOperation<T>(
    operation: () => Promise<T>,
    operationName: string = 'operação',
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // console.log(`🔄 ${operationName} - Tentativa ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error: any) {
        const errorType = error.name || 'UnknownError';
        const errorMessage = error.message || 'Erro desconhecido';

        // console.error(`❌ Tentativa ${attempt} falhou para ${operationName}:`, {
        //   type: errorType,
        //   message: errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''),
        //   attempt: attempt,
        //   maxRetries: maxRetries
        // });

        const isLockError = errorMessage?.includes('NavigatorLockAcquireTimeoutError') ||
                           errorMessage?.includes('lock') ||
                           errorType === 'NavigatorLockAcquireTimeoutError';

        // Se for erro relacionado a lock, tentar limpar
        if (isLockError) {
          // console.log('🔧 Detectado erro de lock, executando limpeza...');
          this.clearOrphanedLocks();

          // Para erros de lock, aguardar progressivamente mais
          const lockDelay = baseDelay * Math.pow(2, attempt - 1);
          // console.log(`🔐 Aguardando ${lockDelay}ms após erro de lock...`);
          await new Promise(resolve => setTimeout(resolve, lockDelay));
        } else if (attempt < maxRetries) {
          // Para outros erros, aguardar normalmente
          const normalDelay = baseDelay * attempt;
          // console.log(`⏳ Aguardando ${normalDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, normalDelay));
        }

        if (attempt === maxRetries) {
          // console.error(`🚫 Todas as ${maxRetries} tentativas falharam para ${operationName}`);
          throw error;
        }
      }
    }

    throw new Error(`Falha após ${maxRetries} tentativas para ${operationName}`);
  }

  private async checkSession() {
    try {
      const { data: { session } } = await this.retryAuthOperation(
        () => this.supabase.auth.getSession(),
        'checkSession'
      );

      if (session) {
        this._session.next(session);
        this._currentUser.next(session.user);
        await this.loadCurrentProfile();
      }
    } catch (error) {
      // console.error('Erro ao verificar sessão:', error);
    }
  }

  private async loadCurrentProfile() {
    const user = this._currentUser.value;
    if (!user) return;

    // MODO EMERGENCIAL: Desabilitar carregamento da tabela profiles temporariamente
    // devido a problemas de conectividade
    // console.log('⚠️ MODO EMERGENCIAL: loadCurrentProfile desabilitado devido a problemas na tabela profiles');
    // console.log('ℹ️ Usando verificação por email como fallback principal');
    return;

    /* CÓDIGO ORIGINAL COMENTADO TEMPORARIAMENTE
    try {
      // Tentar carregar o perfil existente
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro se não existir

      if (error) {
        // console.error('❌ Erro ao carregar perfil:', error);
        // Se houver erro, tentar criar perfil automaticamente para admins
        if (user.email) {
          const adminEmails = [
            'eduard.mass@hotmail.com',
            'admin@example.com',
            'eduar@admin.com',
            'barretoEddy@admin.com',
          ];

          if (adminEmails.includes(user.email.toLowerCase())) {
            // console.log('🔄 Perfil não encontrado para admin, criando automaticamente...');
            await this.autoSyncAdminProfile(user);
          }
        }
        return;
      }

      if (profile) {
        this._currentProfile.next(profile);
        // console.log('✅ Perfil carregado:', { role: profile.role, email: user.email });
      } else {
        // Perfil não existe - criar automaticamente se for admin
        if (user.email) {
          const adminEmails = [
            'eduard.mass@hotmail.com',
            'admin@example.com',
            'eduar@admin.com',
            'barretoEddy@admin.com',
          ];

          if (adminEmails.includes(user.email.toLowerCase())) {
            // console.log('🔄 Criando perfil admin automaticamente...');
            await this.autoSyncAdminProfile(user);
          } else {
            // console.log('ℹ️ Perfil não encontrado para usuário não-admin');
          }
        }
      }
    } catch (error: any) {
      // console.error('❌ Erro ao carregar perfil:', error);
    }
    */
  }

  // Método de inicialização para ser chamado no app.config.ts
  public async initializeAuth(): Promise<void> {
    // console.log('🚀 Inicializando sistema de autenticação...');

    try {
      // 1. Limpar qualquer lock órfão que possa existir
      this.clearOrphanedLocks();

      // 2. Aguardar um momento para que os locks sejam limpos
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Verificar sessão atual
      await this.checkSession();

      // console.log('✅ Sistema de autenticação inicializado com sucesso');
    } catch (error) {
      // console.error('❌ Erro ao inicializar sistema de autenticação:', error);

      // Em caso de erro, tentar uma vez mais após limpar tudo
      try {
        // console.log('🔄 Tentando recuperação de emergência...');
        this.clearOrphanedLocks();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.checkSession();
        // console.log('✅ Recuperação bem-sucedida');
      } catch (recoveryError) {
        // console.error('❌ Falha na recuperação:', recoveryError);
      }
    }
  }

  // Método público para resolver problemas de lock
  public async resolveLockIssues(): Promise<void> {
    try {
      // console.log('🔧 Resolvendo problemas de lock...');

      // 1. Limpar locks órfãos
      this.clearOrphanedLocks();

      // 2. Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Tentar recarregar a sessão
      await this.checkSession();

      // console.log('✅ Problemas de lock resolvidos');
    } catch (error) {
      // console.error('❌ Erro ao resolver locks:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =============================================

  async signUp(email: string, password: string, userData: {
    full_name: string;
    company?: string;
  }): Promise<DatabaseResult<User>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            company: userData.company
          }
        }
      });

      return { data: data.user, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string): Promise<DatabaseResult<User>> {
    try {
      const { data, error } = await this.retryAuthOperation(
        () => this.supabase.auth.signInWithPassword({
          email,
          password
        }),
        'signIn'
      );

      return { data: data.user, error };
    } catch (error) {
      // console.error('Erro no login após múltiplas tentativas:', error);
      return { data: null, error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    // console.log('🚪 Iniciando processo de logout...');

    try {
      // 1. Tentar fazer logout no Supabase
      let supabaseError = null;

      try {
        // console.log('🔄 Fazendo logout no Supabase...');
        const { error } = await this.retryAuthOperation(
          () => this.supabase.auth.signOut(),
          'signOut'
        );
        supabaseError = error;

        if (error) {
          // console.warn('⚠️ Erro no logout do Supabase (continuando limpeza):', error);
        } else {
          // console.log('✅ Logout do Supabase realizado com sucesso');
        }
      } catch (error) {
        // console.warn('⚠️ Falha no logout do Supabase (continuando limpeza):', error);
        supabaseError = error;
      }

      // 2. Sempre limpar o estado local, independente do resultado do Supabase
      //console.log('🧹 Limpando estado local...');

      // Limpar observables imediatamente
      this._currentUser.next(null);
      this._currentProfile.next(null);
      this._session.next(null);

      // 3. Limpar localStorage de forma abrangente
      //console.log('🗑️ Limpando localStorage...');

      try {
        // Backup das chaves antes da limpeza
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) allKeys.push(key);
        }

        // Remover chaves do Supabase
        const supabaseKeys = allKeys.filter(key =>
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token')
        );

        supabaseKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            //console.log(`🗑️ Removido: ${key}`);
          } catch (e) {
            // console.warn(`⚠️ Erro ao remover ${key}:`, e);
          }
        });

        // Remover chaves legadas da aplicação
        const legacyKeys = ['currentUser', 'users', 'contactMessages'];
        legacyKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            //console.log(`🗑️ Removido (legado): ${key}`);
          } catch (e) {
            //console.warn(`⚠️ Erro ao remover ${key}:`, e);
          }
        });

      } catch (storageError) {
        // console.error('❌ Erro ao limpar localStorage:', storageError);
      }

      // 4. Forçar limpeza adicional após um pequeno delay
      setTimeout(() => {
        //console.log('🔄 Limpeza adicional (delayed)...');
        this._currentUser.next(null);
        this._currentProfile.next(null);
        this._session.next(null);
      }, 100);

      //console.log('✅ Processo de logout concluído');
      return { error: supabaseError };

    } catch (error) {
      // console.error('❌ Erro crítico no logout:', error);

      // Mesmo com erro, tentar limpar o máximo possível
      this._currentUser.next(null);
      this._currentProfile.next(null);
      this._session.next(null);

      return { error };
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    return { error };
  }

  // =============================================
  // MÉTODOS DE PERFIL
  // =============================================

  async updateProfile(updates: Partial<Profile>): Promise<DatabaseResult<Profile>> {
    const user = this._currentUser.value;
    if (!user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        this._currentProfile.next(data);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getAllUsers(): Promise<DatabaseResult<Profile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getRecentUsers(limit: number = 5): Promise<DatabaseResult<Profile[]>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // =============================================
  // MÉTODOS DE MENSAGENS
  // =============================================

  async createMessage(messageData: {
    subject: string;
    message: string;
    project_type?: string;
    budget?: string;
    deadline?: string;
  }): Promise<DatabaseResult<ContactMessage>> {
    const user = this._currentUser.value;
    if (!user) {
      //console.error('❌ Usuário não autenticado ao tentar criar mensagem');
      return { data: null, error: 'Usuário não autenticado' };
    }

    try {
      //console.log('📝 Criando mensagem com dados:', messageData);
     //console.log('👤 Usuário autenticado:', user.id);

      const { data, error } = await this.retryAuthOperation(
        async () => {
          return await this.supabase
            .from('contact_messages')
            .insert({
              ...messageData,
              user_id: user.id
            })
            .select(`
              *,
              profiles:user_id (*)
            `)
            .single();
        },
        'createMessage'
      );

      if (error) {
        // console.error('❌ Erro do Supabase ao criar mensagem:', error);
      } else {
        // console.log('✅ Mensagem criada com sucesso:', data);
      }

      return { data, error };
    } catch (error) {
      // console.error('❌ Erro inesperado ao criar mensagem:', error);
      return { data: null, error };
    }
  }

  async getAllMessages(): Promise<DatabaseResult<ContactMessage[]>> {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            company,
            role
          )
        `)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getRecentMessages(limit: number = 5): Promise<DatabaseResult<ContactMessage[]>> {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            company,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateMessageStatus(messageId: string, status: 'new' | 'read' | 'replied'): Promise<DatabaseResult<ContactMessage>> {
    try {
      const { data, error } = await this.supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId)
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            company,
            role
          )
        `)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteMessage(messageId: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  async getMessagesStats(): Promise<{
    total: number;
    new: number;
    read: number;
    replied: number;
  }> {
    try {
      // Buscar todas as mensagens com contagens
      const { data: messages, error } = await this.supabase
        .from('contact_messages')
        .select('status');

      if (error || !messages) {
        return { total: 0, new: 0, read: 0, replied: 0 };
      }

      const stats = messages.reduce((acc, msg) => {
        acc.total++;
        acc[msg.status as keyof typeof acc]++;
        return acc;
      }, { total: 0, new: 0, read: 0, replied: 0 });

      return stats;
    } catch (error) {
      // console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, new: 0, read: 0, replied: 0 };
    }
  }

  // =============================================
  // MÉTODOS DE REAL-TIME
  // =============================================

  subscribeToMessages(callback: (payload: any) => void) {
    return this.supabase
      .channel('contact_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_messages' },
        callback
      )
      .subscribe();
  }

  subscribeToProfiles(callback: (payload: any) => void) {
    return this.supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        callback
      )
      .subscribe();
  }

  // Método público para verificar se a sessão atual ainda é válida
  public async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        // console.log('❌ Sessão inválida ou não encontrada:', error?.message || 'Sem sessão');
        return false;
      }

      // Verificar se o token não expirou
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;

      if (now >= expiresAt) {
        //console.log('⏰ Token expirado, tentando refresh...');
        return await this.refreshSession();
      }

      //console.log('✅ Sessão válida encontrada');
      return true;
    } catch (error) {
      // console.error('❌ Erro ao verificar validade da sessão:', error);
      return false;
    }
  }

  // Método para forçar refresh da sessão
  public async refreshSession(): Promise<boolean> {
    try {
      //console.log('🔄 Fazendo refresh da sessão...');

      const { data: { session }, error } = await this.supabase.auth.refreshSession();

      if (error || !session) {
        //console.log('❌ Falha no refresh da sessão:', error?.message);

        // Se falhou o refresh, limpar tudo e forçar novo login
        await this.signOut();
        return false;
      }

      //console.log('✅ Sessão renovada com sucesso');

      // Atualizar os observables
      this._session.next(session);
      this._currentUser.next(session.user);

      // Recarregar o perfil
      if (session.user) {
        await this.loadCurrentProfile();
      }

      return true;
    } catch (error) {
      // console.error('❌ Erro durante refresh da sessão:', error);
      await this.signOut();
      return false;
    }
  }

  // Método aprimorado para verificar autenticação
  isAuthenticated(): boolean {
    const user = this._currentUser.value;
    const session = this._session.value;

    if (!user || !session) {
      return false;
    }

    // Verificação básica de expiração
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;

    if (now >= expiresAt) {
      //console.log('⏰ Token expirado detectado em isAuthenticated()');
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    const profile = this._currentProfile.value;
    const user = this._currentUser.value;

    // console.log('🔍 isAdmin() verificação:', {
    //   userEmail: user?.email,
    //   profileExists: !!profile,
    //   profileRole: profile?.role,
    //   profileData: profile
    // });

    // SOLUÇÃO EMERGENCIAL: Se há problemas com a tabela profiles,
    // usar verificação puramente por email (mais confiável)
    if (user?.email) {
      const adminEmails = [
        'eduard.mass@hotmail.com',  // Email admin principal
        'admin@example.com',
        'eduar@admin.com',
        'barretoEddy@admin.com',
      ];

      const isEmailAdmin = adminEmails.includes(user.email.toLowerCase());
      // console.log(`🚨 MODO EMERGENCIAL: Verificação por email: ${user.email} é admin? ${isEmailAdmin}`);

      if (isEmailAdmin) {
        // console.log('✅ Admin confirmado por EMAIL (modo emergencial)');
        // Criar um profile temporário em memória para evitar problemas
        const tempProfile = {
          id: user.id,
          username: user.email.split('@')[0],
          full_name: user.email.split('@')[0],
          role: 'admin' as const,
          avatar_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Só atualizar se não houver profile ou se o profile atual não for admin
        if (!profile || profile.role !== 'admin') {
          // console.log('🔄 Criando profile temporário em memória...');
          this._currentProfile.next(tempProfile);
        }

        return true;
      }
    }

    // Fallback original: verificar pelo perfil (se existir e estiver funcionando)
    if (profile?.role === 'admin') {
      //console.log('✅ Admin confirmado por perfil na database');
      return true;
    }

    // console.log('❌ Usuário não é admin');
    return false;
  }

  // Método para sincronização automática e silenciosa do perfil admin
  private async autoSyncAdminProfile(user: any): Promise<void> {
    try {
      if (!user?.id || !user?.email) return;

      const adminEmails = [
        'eduard.mass@hotmail.com',  // Email admin principal
        'admin@example.com',
        'eduar@admin.com',
        'barretoEddy@admin.com',
      ];

      // Só executar para emails admin válidos
      if (!adminEmails.includes(user.email.toLowerCase())) return;

      //console.log('🔄 Sincronizando perfil admin para:', user.email);
      // console.log('📊 Dados do usuário para UPSERT:',
      //   {
      //   id: user.id,
      //   email: user.email,
      //   user_metadata: user.user_metadata
      // });

      // Primeiro testar se conseguimos acessar a tabela profiles
      //console.log('🔍 Testando conectividade com tabela profiles...');
      const { data: testData, error: testError } = await this.supabase
        .from('profiles')
        .select('count(*)', { count: 'exact' });

      //console.log('📊 Teste de conectividade:', { testData, testError });

      try {
        // Usar UPSERT para garantir que o perfil exista com role admin
        //console.log('⚡ Executando UPSERT...');
        const { data, error } = await this.supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              username: user.user_metadata?.username || user.email.split('@')[0],
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              role: 'admin' as const,
              avatar_url: user.user_metadata?.avatar_url || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          .select()
          .single(); // Mudança: usar single() em vez de maybeSingle()

        // console.log('📋 UPSERT executado - resultado:', { data, error });

        if (error) {
          // console.error('❌ Erro detalhado no UPSERT:', {
          //   message: error.message,
          //   details: error.details,
          //   hint: error.hint,
          //   code: error.code
          // });
          return;
        }

        if (data) {
          // console.log('📋 Dados retornados do UPSERT:', data);

          // Atualizar o BehaviorSubject com o novo perfil
          this._currentProfile.next(data);
          // console.log('✅ Perfil admin sincronizado automaticamente');
          // console.log('📊 BehaviorSubject atualizado:', this._currentProfile.value);

          // Forçar uma atualização do status de admin
          setTimeout(() => {
            const currentProfile = this._currentProfile.value;
            // console.log('🔄 Status admin após sincronização:', {
            //   isSupabaseAdmin: this.isAdmin(),
            //   profileRole: currentProfile?.role,
            //   profileData: currentProfile,
            //   email: user.email
            // });
          }, 100);
        } else {
          // console.error('⚠️ UPSERT não retornou dados!');
        }

      } catch (innerError: any) {
        // console.error('❌ Erro durante UPSERT:', innerError);
      }
    } catch (error: any) {
      // console.error('❌ Erro na sincronização automática do perfil admin:', error);
    }
  }

  getCurrentUser(): User | null {
    return this._currentUser.value;
  }

  getCurrentProfile(): Profile | null {
    return this._currentProfile.value;
  }

  // Upload de avatar (se necessário futuramente)
  async uploadAvatar(file: File): Promise<DatabaseResult<string>> {
    const user = this._currentUser.value;
    if (!user) return { data: null, error: 'Usuário não autenticado' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;

    try {
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) return { data: null, error };

      // Atualizar URL do avatar no perfil
      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await this.updateProfile({ avatar_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
