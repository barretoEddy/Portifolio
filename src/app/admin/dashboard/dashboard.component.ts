import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../auth/auth.service';
import { SupabaseService, ContactMessage, Profile } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  newMessages: number;
  readMessages: number;
  repliedMessages: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  private subscriptions: Subscription[] = [];

  currentUser: User | null = null;
  currentProfile: Profile | null = null;

  // Dashboard data
  stats: DashboardStats = {
    totalUsers: 0,
    totalMessages: 0,
    newMessages: 0,
    readMessages: 0,
    repliedMessages: 0
  };

  recentUsers: Profile[] = [];
  recentMessages: ContactMessage[] = [];

  // Loading states
  isLoadingUsers = true;
  isLoadingMessages = true;
  isLoadingStats = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Verificar autenticação
    const authSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (!user || !this.authService.isAdmin()) {
        this.router.navigate(['/login']);
        return;
      }
    });
    this.subscriptions.push(authSub);

    // Carregar perfil atual
    const profileSub = this.supabaseService.currentProfile.subscribe(profile => {
      this.currentProfile = profile;
    });
    this.subscriptions.push(profileSub);

    // Carregar dados do dashboard
    await this.loadDashboardData();

    // Configurar real-time updates
    this.setupRealTimeUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadDashboardData() {
    await Promise.all([
      this.loadUserStats(),
      this.loadMessageStats(),
      this.loadRecentUsers(),
      this.loadRecentMessages()
    ]);
  }

  async loadUserStats() {
    this.isLoadingUsers = true;
    try {
      const result = await this.supabaseService.getAllUsers();
      if (!result.error && result.data) {
        this.stats.totalUsers = result.data.length;
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de usuários:', error);
    } finally {
      this.isLoadingUsers = false;
    }
  }

  async loadMessageStats() {
    this.isLoadingStats = true;
    try {
      const statsResult = await this.supabaseService.getMessagesStats();
      this.stats.totalMessages = statsResult.total;
      this.stats.newMessages = statsResult.new;
      this.stats.readMessages = statsResult.read;
      this.stats.repliedMessages = statsResult.replied;
    } catch (error) {
      console.error('Erro ao carregar estatísticas de mensagens:', error);
    } finally {
      this.isLoadingStats = false;
    }
  }

  async loadRecentUsers() {
    try {
      const result = await this.supabaseService.getRecentUsers(5);
      if (!result.error && result.data) {
        this.recentUsers = result.data;
      }
    } catch (error) {
      console.error('Erro ao carregar usuários recentes:', error);
    }
  }

  async loadRecentMessages() {
    this.isLoadingMessages = true;
    try {
      const result = await this.supabaseService.getRecentMessages(5);
      if (!result.error && result.data) {
        this.recentMessages = result.data;
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens recentes:', error);
    } finally {
      this.isLoadingMessages = false;
    }
  }

  async markAsRead(messageId: string) {
    try {
      const result = await this.supabaseService.updateMessageStatus(messageId, 'read');
      if (!result.error) {
        // Atualizar a lista local
        const messageIndex = this.recentMessages.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
          this.recentMessages[messageIndex].status = 'read';
        }

        // Recarregar estatísticas
        await this.loadMessageStats();
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  }

  async deleteMessage(messageId: string) {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const result = await this.supabaseService.deleteMessage(messageId);
      if (!result.error) {
        // Remover da lista local
        this.recentMessages = this.recentMessages.filter(m => m.id !== messageId);

        // Recarregar estatísticas
        await this.loadMessageStats();
      }
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
    }
  }

  setupRealTimeUpdates() {
    // Real-time updates para mensagens
    const messagesChannel = this.supabaseService.subscribeToMessages((payload) => {
      // Recarregar dados quando houver mudanças
      this.loadRecentMessages();
      this.loadMessageStats();
    });

    // Real-time updates para perfis
    const profilesChannel = this.supabaseService.subscribeToProfiles((payload) => {
      // Recarregar dados quando houver mudanças
      this.loadUserStats();
      this.loadRecentUsers();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
  }

  // Utility methods
  getStatusClass(status: string): string {
    switch(status) {
      case 'new': return 'status-new';
      case 'read': return 'status-read';
      case 'replied': return 'status-replied';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'new': return 'Nova';
      case 'read': return 'Lida';
      case 'replied': return 'Respondida';
      default: return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Track by functions for performance
  trackByUserId(index: number, user: Profile): string {
    return user.id;
  }

  trackByMessageId(index: number, message: ContactMessage): string {
    return message.id;
  }

  // Quick actions
  async refreshData() {
    await this.loadDashboardData();
  }

  viewAllUsers() {
    // Implementar navegação para página de todos os usuários
  }

  viewAllMessages() {
    // Implementar navegação para página de todas as mensagens
  }
}
