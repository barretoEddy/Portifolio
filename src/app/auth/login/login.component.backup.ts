import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.complex.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  isResettingPassword = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '';
  isAdminAccess = false;
  showPasswordReset = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Capturar URL de retorno e indicador de acesso admin primeiro
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.isAdminAccess = this.route.snapshot.queryParams['adminAccess'] === 'true';

    console.log('🔄 LoginComponent: Inicializando com parâmetros:', {
      returnUrl: this.returnUrl,
      isAdminAccess: this.isAdminAccess
    });

    // Verificar se já está logado (aguardar um momento para inicialização)
    setTimeout(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      const hasUser = !!this.authService.currentUserValue;
      
      console.log('🔄 LoginComponent: Verificação inicial:', { isLoggedIn, hasUser });
      
      if (isLoggedIn && hasUser) {
        console.log('✅ LoginComponent: Usuário já logado, redirecionando...');
        this.performSimpleRedirect(this.authService.currentUserValue!);
      }
    }, 500);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          console.log('🔐 LoginComponent: Login bem-sucedido:', {
            userId: user.id,
            userRole: user.role,
            userEmail: user.email,
            isAdmin: this.authService.isAdmin(),
            isAdminAccess: this.isAdminAccess,
            currentUserValue: this.authService.currentUserValue
          });

          this.successMessage = `Bem-vindo(a), ${user.fullName}!`;

          // Verificar se é acesso admin mas usuário não é admin
          if (this.isAdminAccess && !this.authService.isAdmin()) {
            this.isLoading = false;
            this.errorMessage = 'Acesso negado. Esta área é restrita a administradores.';
            return;
          }

          // Redirecionamento imediato mais simples
          setTimeout(() => {
            console.log('🚀 LoginComponent: Iniciando redirecionamento...');
            this.performSimpleRedirect(user);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          
          console.error('❌ LoginComponent: Erro no login:', error);

          // Tratamento de erro mais amigável baseado no tipo de erro Supabase
          if (error.message?.includes('Invalid login credentials')) {
            this.errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
          } else if (error.message?.includes('Email not confirmed')) {
            this.errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
          } else if (error.message?.includes('Too many requests')) {
            this.errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
          } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
            this.errorMessage = 'Timeout ao carregar dados. Tente novamente.';
          } else {
            this.errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
          }
        }
      });
    } else {
      // Marcar todos os campos como touched para mostrar erros de validação
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  resetPassword() {
    const email = this.loginForm.get('email')?.value;

    if (!email) {
      this.errorMessage = 'Por favor, digite seu email no campo acima para resetar a senha.';
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    if (this.loginForm.get('email')?.invalid) {
      this.errorMessage = 'Por favor, digite um email válido.';
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    this.isResettingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(email).subscribe({
      next: () => {
        this.isResettingPassword = false;
        this.successMessage = 'Email de recuperação enviado! Verifique sua caixa de entrada.';
        this.showPasswordReset = false;
      },
      error: (error) => {
        this.isResettingPassword = false;
        this.errorMessage = error.message || 'Erro ao enviar email de recuperação. Tente novamente.';
      }
    });
  }

  togglePasswordReset() {
    this.showPasswordReset = !this.showPasswordReset;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private redirectBasedOnRole() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      const redirectUrl = this.returnUrl !== '/' ? this.returnUrl : '/protected-contact';
      this.router.navigate([redirectUrl]);
    }
  }

  private async redirectBasedOnRoleAsync() {
    console.log('🔄 LoginComponent: Iniciando redirecionamento baseado no papel...');

    try {
      // Primeiro, verificar se já temos dados imediatamente disponíveis
      const currentUser = this.authService.currentUserValue;
      if (currentUser) {
        console.log('✅ LoginComponent: Dados já disponíveis, redirecionando imediatamente');
        return this.performRedirect(currentUser);
      }

      // Se não tem dados, aguardar carregamento
      console.log('⏳ LoginComponent: Aguardando carregamento dos dados...');
      
      let attempts = 0;
      const maxAttempts = 15; // 3 segundos no máximo

      while (attempts < maxAttempts) {
        const isLoggedIn = this.authService.isLoggedIn();
        const user = this.authService.currentUserValue;

        console.log(`🔍 LoginComponent: Tentativa ${attempts + 1}/${maxAttempts}:`, {
          isLoggedIn,
          hasCurrentUser: !!user,
          userRole: user?.role,
          userId: user?.id
        });

        if (user) {
          console.log('✅ LoginComponent: Dados carregados após aguardar');
          return this.performRedirect(user);
        }

        // Se passou muito tempo sem dados, forçar redirecionamento básico
        if (attempts > 10 && isLoggedIn) {
          console.log('⚠️ LoginComponent: Forçando redirecionamento básico');
          const destination = this.isAdminAccess ? '/admin/dashboard' : '/protected-contact';
          await this.router.navigate([destination]);
          console.log('🚀 LoginComponent: Redirecionamento forçado para:', destination);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      // Timeout - algo deu errado
      console.error('⏰ LoginComponent: Timeout completo - redirecionamento de emergência');
      const emergencyDestination = this.returnUrl !== '/' ? this.returnUrl : '/protected-contact';
      await this.router.navigate([emergencyDestination]);
      console.log('� LoginComponent: Redirecionamento de emergência para:', emergencyDestination);

    } catch (error) {
      console.error('❌ LoginComponent: Erro crítico durante redirecionamento:', error);
      this.errorMessage = 'Erro ao redirecionar. Tente novamente.';
    }
  }

  private performSimpleRedirect(user: any) {
    console.log('🎯 LoginComponent: Redirecionamento simples para usuário:', {
      id: user.id,
      role: user.role,
      email: user.email
    });

    try {
      // Determinar destino baseado no papel do usuário retornado pelo login
      let destination: string;
      
      // Usar o role diretamente do usuário retornado
      if (user.role === 'admin') {
        destination = '/admin/dashboard';
        console.log('👑 LoginComponent: Admin detectado, indo para dashboard');
      } else {
        destination = this.returnUrl !== '/' ? this.returnUrl : '/protected-contact';
        console.log('👤 LoginComponent: Usuário comum, indo para:', destination);
      }

      // Verificação adicional para admin access
      if (this.isAdminAccess && user.role !== 'admin') {
        console.log('❌ LoginComponent: Tentativa de acesso admin negada');
        this.errorMessage = 'Acesso negado. Esta área é restrita a administradores.';
        this.isLoading = false;
        return;
      }

      // Executar navegação
      console.log('🚀 LoginComponent: Navegando para:', destination);
      this.router.navigate([destination]).then(success => {
        console.log('📍 LoginComponent: Navegação concluída:', success);
        this.isLoading = false;
      }).catch(error => {
        console.error('❌ LoginComponent: Erro na navegação:', error);
        this.errorMessage = 'Erro ao redirecionar. Recarregue a página.';
        this.isLoading = false;
      });

    } catch (error) {
      console.error('❌ LoginComponent: Erro no redirecionamento simples:', error);
      this.errorMessage = 'Erro ao redirecionar. Tente novamente.';
      this.isLoading = false;
    }
  }

  private async performRedirect(user: any) {
    console.log('🎯 LoginComponent: Executando redirecionamento para usuário:', {
      id: user.id,
      role: user.role,
      email: user.email
    });

    const isAdmin = this.authService.isAdmin();

    // Verificação final para admin access
    if (this.isAdminAccess && !isAdmin) {
      console.log('❌ LoginComponent: Acesso admin negado para usuário não-admin');
      this.errorMessage = 'Acesso negado. Esta área é restrita a administradores.';
      return;
    }

    // Determinar destino
    let destination: string;
    if (isAdmin) {
      destination = '/admin/dashboard';
      console.log('👑 LoginComponent: Redirecionando admin para dashboard');
    } else {
      destination = this.returnUrl !== '/' ? this.returnUrl : '/protected-contact';
      console.log('👤 LoginComponent: Redirecionando usuário para:', destination);
    }

    // Executar navegação
    await this.router.navigate([destination]);
    console.log('🚀 LoginComponent: Redirecionamento concluído com sucesso para:', destination);
  }

  goToRegister() {
    const queryParams = this.isAdminAccess ? { adminAccess: true } : {};
    this.router.navigate(['/register'], { queryParams });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  // Getters para facilitar validação no template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  get emailErrorMessage(): string {
    const email = this.loginForm.get('email');
    if (email?.hasError('required') && email?.touched) {
      return 'Email é obrigatório';
    }
    if (email?.hasError('email') && email?.touched) {
      return 'Digite um email válido';
    }
    return '';
  }

  get passwordErrorMessage(): string {
    const password = this.loginForm.get('password');
    if (password?.hasError('required') && password?.touched) {
      return 'Senha é obrigatória';
    }
    if (password?.hasError('minlength') && password?.touched) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return '';
  }
}
