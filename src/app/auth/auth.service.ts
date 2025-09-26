import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, map, switchMap } from 'rxjs';
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

    // Subscrever aos observables do SupabaseService
    this.supabaseService.currentProfile.subscribe(profile => {
      if (profile) {
        const user = this.mapProfileToUser(profile);
        this.currentUserSubject.next(user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
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
    return from(this.supabaseService.signIn(email, password)).pipe(
      switchMap(result => {
        if (result.error) {
          throw new Error(result.error.message || 'Email ou senha inválidos');
        }

        // Aguardar o perfil ser carregado automaticamente pelo SupabaseService
        return this.currentUser.pipe(
          map(user => {
            if (!user) {
              throw new Error('Erro ao carregar dados do usuário');
            }
            return user;
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
    return from(this.supabaseService.signUp(userData.email, userData.password, {
      full_name: userData.fullName,
      company: userData.company
    })).pipe(
      switchMap(result => {
        if (result.error) {
          throw new Error(result.error.message || 'Erro ao criar conta');
        }

        // Aguardar o perfil ser carregado automaticamente
        return this.currentUser.pipe(
          map(user => {
            if (!user) {
              throw new Error('Erro ao carregar dados do usuário');
            }
            return user;
          })
        );
      })
    );
  }

  logout(): void {
    this.supabaseService.signOut().then(result => {
      if (result.error) {
        console.error('Erro ao fazer logout:', result.error);
      }

      // Garantir que o estado local também seja limpo
      this.currentUserSubject.next(null);

      // Função para limpar TODAS as chaves do Supabase
      const clearSupabaseData = () => {
        const keysToRemove = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      };

      // Limpar dados do Supabase
      clearSupabaseData();

      // Limpar dados legados do localStorage (compatibilidade)
      localStorage.removeItem('currentUser');
      localStorage.removeItem('users');
      localStorage.removeItem('contactMessages');

      // O estado será atualizado automaticamente pelo SupabaseService também
    });
  }

  isLoggedIn(): boolean {
    return this.supabaseService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.supabaseService.isAdmin();
  }

  hasAdminAccess(): boolean {
    return this.isLoggedIn() && this.isAdmin();
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
