import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { PolicyModalComponent, PolicyType } from '../../shared/policy-modal/policy-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PolicyModalComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.complex.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAdminAccess = false;

  // Modal state
  isModalOpen = false;
  modalPolicyType: PolicyType = 'terms';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Verificar se já está logado
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
      return;
    }

    // Capturar indicador de acesso admin
    this.isAdminAccess = this.route.snapshot.queryParams['adminAccess'] === 'true';
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData = {
        fullName: this.registerForm.value.fullName,
        email: this.registerForm.value.email,
        company: this.registerForm.value.company,
        password: this.registerForm.value.password
      };

      this.authService.register(userData).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.successMessage = `Conta criada com sucesso, ${user.fullName}! Redirecionando...`;

          // Redirecionar imediatamente após sucesso
          this.redirectBasedOnRole();
        },
        error: (error) => {
          this.isLoading = false;

          // Tratamento de erro mais amigável baseado no tipo de erro Supabase
          if (error.message?.includes('User already registered')) {
            this.errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
            // Se usuário já existe, oferecer redirecionamento para login
            setTimeout(() => {
              this.goToLogin();
            }, 3000);
          } else if (error.message?.includes('Password should be at least')) {
            this.errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
          } else if (error.message?.includes('Unable to validate email address')) {
            this.errorMessage = 'Email inválido. Verifique o formato do email.';
          } else if (error.message?.includes('Signup is disabled')) {
            this.errorMessage = 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
          } else if (error.message?.includes('timeout') || error.message?.includes('Timeout') || error.name === 'TimeoutError') {
            this.errorMessage = 'Timeout na conexão. Verifique sua internet e tente novamente.';
          } else {
            this.errorMessage = error.message || 'Erro ao criar conta. Tente novamente.';
          }
        }
      });
    }
  }

  private async redirectBasedOnRole() {
    // Aguardar um momento para garantir que a autenticação esteja processada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let attempts = 0;
    const maxAttempts = 15; // 3 segundos total (15 * 200ms)
    
    while (attempts < maxAttempts) {
      const isLoggedIn = this.authService.isLoggedIn();
      const isAdmin = this.authService.isAdmin();
      const currentUser = this.authService.currentUserValue;

      if (currentUser && isLoggedIn) {
        if (isAdmin) {
          this.router.navigate(['/admin/dashboard']);
          return;
        } else {
          this.router.navigate(['/protected-contact']);
          return;
        }
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    // Fallback: se não conseguiu determinar o role, assumir usuário normal
    this.router.navigate(['/protected-contact']);
  }  goToLogin() {
    const queryParams = this.isAdminAccess ? { adminAccess: true } : {};
    this.router.navigate(['/login'], { queryParams });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong';
    return 'medium';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
      default: return '';
    }
  }

  // Getters para facilitar validação no template
  get fullName() { return this.registerForm.get('fullName'); }
  get email() { return this.registerForm.get('email'); }
  get company() { return this.registerForm.get('company'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get acceptTerms() { return this.registerForm.get('acceptTerms'); }

  get fullNameErrorMessage(): string {
    const control = this.fullName;
    if (control?.hasError('required') && control?.touched) {
      return 'Nome completo é obrigatório';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }
    return '';
  }

  get emailErrorMessage(): string {
    const control = this.email;
    if (control?.hasError('required') && control?.touched) {
      return 'Email é obrigatório';
    }
    if (control?.hasError('email') && control?.touched) {
      return 'Digite um email válido';
    }
    return '';
  }

  get passwordErrorMessage(): string {
    const control = this.password;
    if (control?.hasError('required') && control?.touched) {
      return 'Senha é obrigatória';
    }
    if (control?.hasError('minlength') && control?.touched) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return '';
  }

  get confirmPasswordErrorMessage(): string {
    const control = this.confirmPassword;
    if (control?.hasError('required') && control?.touched) {
      return 'Confirmação de senha é obrigatória';
    }
    if (control?.hasError('mismatch') && control?.touched) {
      return 'As senhas não coincidem';
    }
    return '';
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // Modal methods
  openTermsModal(event: Event): void {
    event.preventDefault();
    this.modalPolicyType = 'terms';
    this.isModalOpen = true;
  }

  openPrivacyModal(event: Event): void {
    event.preventDefault();
    this.modalPolicyType = 'privacy';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
