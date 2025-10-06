import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type PolicyType = 'terms' | 'privacy';

@Component({
  selector: 'app-policy-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './policy-modal.component.html',
  styleUrls: ['./policy-modal.component.css']
})
export class PolicyModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() policyType: PolicyType = 'terms';
  @Output() close = new EventEmitter<void>();

  lastUpdated = '20 de Janeiro de 2025';

  ngOnInit(): void {
    // Prevenir scroll do body quando modal está aberto
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    // Restaurar scroll do body
    document.body.style.overflow = '';
  }

  onClose(): void {
    document.body.style.overflow = '';
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Fechar apenas se clicar no backdrop, não no conteúdo
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  get modalTitle(): string {
    return this.policyType === 'terms' ? 'Termos de Uso' : 'Política de Privacidade';
  }

  get fullPageRoute(): string {
    return this.policyType === 'terms' ? '/termos-de-uso' : '/politica-privacidade';
  }
}
