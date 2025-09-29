import { Component, ChangeDetectionStrategy, HostListener, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { filter } from 'rxjs/operators';

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
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  headerScrolled = signal(false);
  mobileMenuOpen = signal(false);
  isLoggedIn = signal(false);
  isAdmin = signal(false);
  userFullName = signal<string | null>(null);
  isHomePage = signal(true); // Controla se mostra o logo

  // Texto dinâmico do botão baseado no estado
  buttonText = computed(() => {
    if (this.isLoggedIn()) {
      const name = this.userFullName();
      return name ? `Olá, ${name.split(' ')[0]}` : 'Minha Área';
    }
    return 'Contato';
  });

  // Links dinâmicos baseados no estado de login
  navLinks = computed(() => {
    const baseLinks = [
      { path: '/', label: 'Início', action: 'scrollToTop' },
      { path: '/blog', label: 'Blog', action: null },
    ];

    if (this.isLoggedIn()) {
      // Adicionar links específicos para usuários logados
      return [
        ...baseLinks,
        { path: '/protected-contact', label: 'Contato', action: null },
        ...(this.isAdmin() ? [{ path: '/admin/dashboard', label: 'Dashboard', action: null }] : [])
      ];
    }

    return baseLinks;
  });

  ngOnInit() {
    // Detectar mudanças de rota para controlar o logo
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Logo aparece na home e no blog
      const showLogo = event.urlAfterRedirects === '/' ||
                      event.urlAfterRedirects === '' ||
                      event.urlAfterRedirects.startsWith('/blog');
      this.isHomePage.set(showLogo);
    });

    // Verificar rota inicial
    const currentUrl = this.router.url;
    const showLogo = currentUrl === '/' ||
                    currentUrl === '' ||
                    currentUrl.startsWith('/blog');
    this.isHomePage.set(showLogo);

    // Observar mudanças no estado de autenticação do AuthService
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn.set(!!user);
      this.userFullName.set(user?.fullName || null);
      this.isAdmin.set(this.authService.isAdmin());
    });

    // Também observar o Supabase service para sincronizar
    this.supabaseService.currentUser.subscribe(user => {
      if (user && !this.isLoggedIn()) {
        this.isLoggedIn.set(true);
        this.userFullName.set(user.user_metadata?.['full_name'] || user.email || null);
      }
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
  async logout() {
    //console.log('🚪 HeaderComponent: Iniciando logout...');
    this.closeMobileMenu();

    try {
      // 1. Limpar estado local do header imediatamente (para UI responsiva)
      //console.log('🧹 HeaderComponent: Limpando estado local...');
      this.isLoggedIn.set(false);
      this.userFullName.set(null);
      this.isAdmin.set(false);

      // 2. Usar APENAS AuthService.logout() que já faz tudo (Supabase + tokens + local)
      //console.log('🔄 HeaderComponent: Chamando AuthService.logout()...');
      this.authService.logout();

      // 3. Aguardar um momento para as limpezas serem processadas
      //console.log('⏳ HeaderComponent: Aguardando processamento...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Verificação final
      const finalCheck = {
        supabaseAuth: this.supabaseService.isAuthenticated(),
        authServiceAuth: this.authService.isLoggedIn(),
        headerLoggedIn: this.isLoggedIn()
      };
      //console.log('🔍 HeaderComponent: Verificação final após logout:', finalCheck);

      // 5. Navegar para home
      //console.log('🏠 HeaderComponent: Navegando para home...');
      await this.router.navigate(['/'], { replaceUrl: true });

      //console.log('✅ HeaderComponent: Logout concluído com sucesso');

    } catch (error) {
      //console.error('❌ HeaderComponent: Erro durante logout:', error);

      // Em caso de erro, forçar limpeza local
      //console.log('🆘 HeaderComponent: Executando limpeza de emergência...');

      this.isLoggedIn.set(false);
      this.userFullName.set(null);
      this.isAdmin.set(false);

      // Tentar navegar mesmo com erro
      try {
        await this.router.navigate(['/'], { replaceUrl: true });
      } catch (navError) {
        //console.error('❌ HeaderComponent: Erro na navegação:', navError);
        // Forçar navegação via window.location como último recurso
        window.location.href = '/';
      }
    }
  }

  trackByPath(index: number, link: any): string {
    return link.path;
  }
}
