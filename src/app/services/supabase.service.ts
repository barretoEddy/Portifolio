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
    // Inicializar cliente Supabase
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Escutar mudanças de autenticação
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this._session.next(session);

      if (session?.user) {
        this._currentUser.next(session.user);
        await this.loadCurrentProfile();
      } else {
        this._currentUser.next(null);
        this._currentProfile.next(null);
      }
    });

    // Verificar se já existe uma sessão
    this.checkSession();
  }

  private async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this._session.next(session);
      this._currentUser.next(session.user);
      await this.loadCurrentProfile();
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
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      return { data: data.user, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signOut();

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
    if (!user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await this.supabase
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

      return { data, error };
    } catch (error) {
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
