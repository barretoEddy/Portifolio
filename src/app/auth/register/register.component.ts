import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAdminAccess = false;

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
          this.successMessage = 'Conta criada com sucesso! Redirecionando...';
          
          setTimeout(() => {
            this.redirectBasedOnRole();
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error;
        }
      });
    }
  }

  private redirectBasedOnRole() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/protected-contact']);
    }
  }

  goToLogin() {
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
}
