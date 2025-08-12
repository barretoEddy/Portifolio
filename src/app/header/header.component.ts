import { Component, ChangeDetectionStrategy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css', // Corrigido para .css
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  headerScrolled = signal(false);
  mobileMenuOpen = signal(false);

  navLinks = [
    { anchor: 'hero', label: 'Início' },
    { anchor: 'cabin', label: 'Sobre Mim' },
    { anchor: 'maintenance', label: 'Serviços' },
    { anchor: 'perception', label: 'Portfólio' },
    { anchor: 'conclusion', label: 'Contato' },
  ];

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
}
