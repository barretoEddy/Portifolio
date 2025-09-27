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
          flowType: 'pkce'
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
        console.error('Erro no onAuthStateChange:', error);

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
      // Limpar keys relacionadas a locks do Supabase que podem estar órfãs
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') && key.includes('auth-token')
      );

      authKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Se o token expirou há mais de 1 hora, remover
            if (parsed.expires_at && (Date.now() / 1000) > (parsed.expires_at + 3600)) {
              localStorage.removeItem(key);
              console.log(`Removido token expirado: ${key}`);
            }
          }
        } catch (e) {
          // Se não conseguir fazer parse, remover o key problemático
          localStorage.removeItem(key);
          console.log(`Removido key problemático: ${key}`);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar locks órfãos:', error);
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
        console.log(`🔄 ${operationName} - Tentativa ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error: any) {
        const errorType = error.name || 'UnknownError';
        const errorMessage = error.message || 'Erro desconhecido';

        console.error(`❌ Tentativa ${attempt} falhou para ${operationName}:`, {
          type: errorType,
          message: errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''),
          attempt: attempt,
          maxRetries: maxRetries
        });

        const isLockError = errorMessage?.includes('NavigatorLockAcquireTimeoutError') ||
                           errorMessage?.includes('lock') ||
                           errorType === 'NavigatorLockAcquireTimeoutError';

        // Se for erro relacionado a lock, tentar limpar
        if (isLockError) {
          console.log('🔧 Detectado erro de lock, executando limpeza...');
          this.clearOrphanedLocks();

          // Para erros de lock, aguardar progressivamente mais
          const lockDelay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`🔐 Aguardando ${lockDelay}ms após erro de lock...`);
          await new Promise(resolve => setTimeout(resolve, lockDelay));
        } else if (attempt < maxRetries) {
          // Para outros erros, aguardar normalmente
          const normalDelay = baseDelay * attempt;
          console.log(`⏳ Aguardando ${normalDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, normalDelay));
        }

        if (attempt === maxRetries) {
          console.error(`🚫 Todas as ${maxRetries} tentativas falharam para ${operationName}`);
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
      console.error('Erro ao verificar sessão:', error);
    }
  }

  private async loadCurrentProfile() {
    const user = this._currentUser.value;
    if (!user) return;

    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
      return;
    }

    this._currentProfile.next(profile);
  }

  // Método de inicialização para ser chamado no app.config.ts
  public async initializeAuth(): Promise<void> {
    console.log('🚀 Inicializando sistema de autenticação...');

    try {
      // 1. Limpar qualquer lock órfão que possa existir
      this.clearOrphanedLocks();

      // 2. Aguardar um momento para que os locks sejam limpos
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Verificar sessão atual
      await this.checkSession();

      console.log('✅ Sistema de autenticação inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de autenticação:', error);

      // Em caso de erro, tentar uma vez mais após limpar tudo
      try {
        console.log('🔄 Tentando recuperação de emergência...');
        this.clearOrphanedLocks();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.checkSession();
        console.log('✅ Recuperação bem-sucedida');
      } catch (recoveryError) {
        console.error('❌ Falha na recuperação:', recoveryError);
      }
    }
  }

  // Método público para resolver problemas de lock
  public async resolveLockIssues(): Promise<void> {
    try {
      console.log('🔧 Resolvendo problemas de lock...');

      // 1. Limpar locks órfãos
      this.clearOrphanedLocks();

      // 2. Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Tentar recarregar a sessão
      await this.checkSession();

      console.log('✅ Problemas de lock resolvidos');
    } catch (error) {
      console.error('❌ Erro ao resolver locks:', error);
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
      console.error('Erro no login após múltiplas tentativas:', error);
      return { data: null, error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await this.retryAuthOperation(
        () => this.supabase.auth.signOut(),
        'signOut'
      );

      if (!error) {
        // Limpar estado dos observables
        this._currentUser.next(null);
        this._currentProfile.next(null);
        this._session.next(null);

        // Limpar TODAS as chaves do Supabase do localStorage
        const keysToRemove = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Limpar dados legados da aplicação
        localStorage.removeItem('currentUser');
        localStorage.removeItem('users');
        localStorage.removeItem('contactMessages');
      }

      return { error };
    } catch (error) {
      console.error('Erro no logout após múltiplas tentativas:', error);
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
      console.error('❌ Usuário não autenticado ao tentar criar mensagem');
      return { data: null, error: 'Usuário não autenticado' };
    }

    try {
      console.log('📝 Criando mensagem com dados:', messageData);
      console.log('👤 Usuário autenticado:', user.id);

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
        console.error('❌ Erro do Supabase ao criar mensagem:', error);
      } else {
        console.log('✅ Mensagem criada com sucesso:', data);
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Erro inesperado ao criar mensagem:', error);
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
      console.error('Erro ao buscar estatísticas:', error);
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

  // =============================================
  // MÉTODOS UTILITÁRIOS
  // =============================================

  isAuthenticated(): boolean {
    return this._currentUser.value !== null;
  }

  isAdmin(): boolean {
    const profile = this._currentProfile.value;
    return profile?.role === 'admin';
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
