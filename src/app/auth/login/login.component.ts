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
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';
  isAdminAccess = false;

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
      
      const { email, password } = this.loginForm.value;
      
      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          
          // Verificar se é acesso admin mas usuário não é admin
          if (this.isAdminAccess && !this.authService.isAdmin()) {
            this.errorMessage = 'Acesso negado. Esta área é restrita a administradores.';
            return;
          }
          
          // Redirecionar baseado no papel do usuário
          this.redirectBasedOnRole();
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
}
