import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    // Verificar se existe usuário no localStorage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    return new Observable(observer => {
      // Simular API de login
      setTimeout(() => {
        // Verificar se usuário existe no localStorage (simulação)
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);
        
        if (user) {
          // Simular autenticação bem-sucedida
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          observer.next(user);
          observer.complete();
        } else {
          observer.error('Email ou senha inválidos');
        }
      }, 1000);
    });
  }

  register(userData: {
    fullName: string;
    email: string;
    company?: string;
    password: string;
  }): Observable<User> {
    return new Observable(observer => {
      // Simular API de registro
      setTimeout(() => {
        const users = this.getStoredUsers();
        
        // Verificar se email já existe
        if (users.find(u => u.email === userData.email)) {
          observer.error('Email já cadastrado');
          return;
        }

        // Criar novo usuário
        const newUser: User = {
          id: Date.now().toString(),
          fullName: userData.fullName,
          email: userData.email,
          company: userData.company,
          role: userData.email === 'admin@eduardobarreto.dev' ? 'admin' : 'user', // Define admin baseado no email
          createdAt: new Date()
        };

        // Salvar no localStorage
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.currentUserSubject.next(newUser);
        observer.next(newUser);
        observer.complete();
      }, 1500);
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'admin' || false;
  }

  hasAdminAccess(): boolean {
    return this.isLoggedIn() && this.isAdmin();
  }

  private getStoredUsers(): User[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }
}