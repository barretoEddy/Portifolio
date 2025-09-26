import { Component, ChangeDetectionStrategy, HostListener, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  headerScrolled = signal(false);
  mobileMenuOpen = signal(false);
  isLoggedIn = signal(false);
  isAdmin = signal(false);
  userFullName = signal<string | null>(null);

  // Texto dinâmico do botão baseado no estado
  buttonText = computed(() => {
    if (this.isLoggedIn()) {
      const name = this.userFullName();
      return name ? `Olá, ${name.split(' ')[0]}` : 'Minha Área';
    }
    return 'Contato';
  });

  // Agora os caminhos são para rotas do Angular
  navLinks = [
    { path: '/', label: 'Início', action: 'scrollToTop' },
    { path: '/blog', label: 'Blog', action: null },
  ];

  ngOnInit() {
    // Observar mudanças no estado de autenticação
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn.set(!!user);
      this.userFullName.set(user?.fullName || null);
      this.isAdmin.set(this.authService.isAdmin());
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.headerScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(isOpen => !isOpen);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  // Método inteligente para redirecionar baseado no estado
  handleContactButton() {
    this.closeMobileMenu();

    if (!this.isLoggedIn()) {
      // Não está logado -> vai para login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/protected-contact' }
      });
    } else if (this.isAdmin()) {
      // É admin -> vai para dashboard
      this.router.navigate(['/admin/dashboard']);
    } else {
      // É usuário normal -> vai para área protegida
      this.router.navigate(['/protected-contact']);
    }
  }

  // Método para lidar com cliques de navegação
  handleNavClick(link: any) {
    this.closeMobileMenu();

    if (link.action === 'scrollToTop' && this.router.url === '/') {
      // Se estivermos na página inicial e for o botão Início, faz scroll suave ao topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Senão, navega normalmente
      this.router.navigate([link.path]);
    }
  }

  // Método para fazer logout
  logout() {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  trackByPath(index: number, link: any): string {
    return link.path;
  }
}
