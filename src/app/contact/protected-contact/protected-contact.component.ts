import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../auth/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-protected-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './protected-contact.component.html',
  styleUrl: './protected-contact.component.css'
})
export class ProtectedContactComponent implements OnInit {
  contactForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.contactForm = this.formBuilder.group({
      subject: ['', [Validators.required]],
      projectType: ['', [Validators.required]],
      budget: [''],
      deadline: [''],
      message: ['', [Validators.required, Validators.minLength(20)]],
      attachment: [null]
    });
  }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  async onSubmit() {
    if (this.contactForm.valid && this.currentUser) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        // Preparar dados para o Supabase
        const messageData = {
          subject: this.contactForm.value.subject,
          message: this.contactForm.value.message,
          project_type: this.contactForm.value.projectType,
          budget: this.contactForm.value.budget,
          deadline: this.contactForm.value.deadline
        };

        console.log('📤 Enviando mensagem para Supabase:', messageData);

        // Enviar para o Supabase
        const result = await this.supabaseService.createMessage(messageData);

        if (result.error) {
          console.error('❌ Erro ao enviar mensagem:', result.error);
          this.errorMessage = 'Erro ao enviar mensagem. Tente novamente.';
        } else {
          console.log('✅ Mensagem enviada com sucesso:', result.data);
          this.successMessage = 'Mensagem enviada com sucesso! Retornaremos em breve.';
          this.contactForm.reset();

          // Limpar mensagem de sucesso após 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        }
      } catch (error) {
        console.error('❌ Erro inesperado:', error);
        this.errorMessage = 'Erro inesperado. Tente novamente.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}
