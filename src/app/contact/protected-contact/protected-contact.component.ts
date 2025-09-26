import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../auth/auth.service';
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

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
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

  onSubmit() {
    if (this.contactForm.valid && this.currentUser) {
      this.isLoading = true;

      const contactData = {
        ...this.contactForm.value,
        userInfo: {
          name: this.currentUser.fullName,
          email: this.currentUser.email,
          company: this.currentUser.company
        },
        timestamp: new Date(),
        id: Date.now().toString(),
        status: 'new'
      };

      // Salvar a mensagem no localStorage para o dashboard admin
      const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      const newMessage = {
        id: contactData.id,
        user: this.currentUser,
        subject: contactData.subject,
        projectType: contactData.projectType,
        budget: contactData.budget,
        deadline: contactData.deadline,
        message: contactData.message,
        timestamp: contactData.timestamp,
        status: contactData.status
      };

      existingMessages.push(newMessage);
      localStorage.setItem('contactMessages', JSON.stringify(existingMessages));

      // Simular envio - dados enviados com sucesso
      setTimeout(() => {
        this.isLoading = false;
        this.successMessage = 'Mensagem enviada com sucesso! Retornaremos em breve.';
        this.contactForm.reset();

        // Limpar mensagem de sucesso após 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      }, 2000);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
