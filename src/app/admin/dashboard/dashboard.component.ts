import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../auth/auth.service';
import { Router } from '@angular/router';

interface ContactMessage {
  id: string;
  user: User;
  subject: string;
  projectType: string;
  budget: string;
  deadline: string;
  message: string;
  timestamp: Date;
  status: 'new' | 'read' | 'replied';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  totalUsers = 0;
  totalMessages = 0;
  newMessages = 0;
  recentUsers: User[] = [];
  recentMessages: ContactMessage[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (!user || !this.authService.isAdmin()) {
        this.router.navigate(['/login']);
        return;
      }
      this.loadDashboardData();
    });
  }

  loadDashboardData() {
    // Simular carregamento de dados do dashboard
    this.loadUserStats();
    this.loadRecentMessages();
  }

  loadUserStats() {
    // Simular dados de usuários
    const users = this.getStoredUsers();
    this.totalUsers = users.length;
    this.recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  loadRecentMessages() {
    // Simular dados de mensagens
    const messages = this.getStoredMessages();
    this.totalMessages = messages.length;
    this.newMessages = messages.filter(m => m.status === 'new').length;
    this.recentMessages = messages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }

  markAsRead(messageId: string) {
    const messages = this.getStoredMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > -1) {
      messages[messageIndex].status = 'read';
      localStorage.setItem('contactMessages', JSON.stringify(messages));
      this.loadRecentMessages();
    }
  }

  deleteMessage(messageId: string) {
    const messages = this.getStoredMessages();
    const filteredMessages = messages.filter(m => m.id !== messageId);
    localStorage.setItem('contactMessages', JSON.stringify(filteredMessages));
    this.loadRecentMessages();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private getStoredUsers(): User[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  private getStoredMessages(): ContactMessage[] {
    const messages = localStorage.getItem('contactMessages');
    return messages ? JSON.parse(messages) : [];
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'new': return 'status-new';
      case 'read': return 'status-read';
      case 'replied': return 'status-replied';
      default: return '';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  trackByMessageId(index: number, message: ContactMessage): string {
    return message.id;
  }
}