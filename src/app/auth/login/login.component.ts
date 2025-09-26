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
    // Verificar se já está logado
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
      return;
    }

    // Capturar URL de retorno e indicador de acesso admin
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.isAdminAccess = this.route.snapshot.queryParams['adminAccess'] === 'true';
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;

          // Verificar se é acesso admin mas usuário não é admin
          if (this.isAdminAccess && !this.authService.isAdmin()) {
            this.errorMessage = 'Acesso negado. Esta área é restrita a administradores.';
            return;
          }

          this.successMessage = `Bem-vindo(a), ${user.fullName}!`;

          // Aguardar um pouco para mostrar a mensagem de sucesso
          setTimeout(() => {
            this.redirectBasedOnRole();
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;

          // Tratamento de erro mais amigável baseado no tipo de erro Supabase
          if (error.message?.includes('Invalid login credentials')) {
            this.errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
          } else if (error.message?.includes('Email not confirmed')) {
            this.errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
          } else if (error.message?.includes('Too many requests')) {
            this.errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
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
