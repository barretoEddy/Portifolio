import { Component, ChangeDetectionStrategy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importe o RouterModule

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule], // Adicione RouterModule aqui
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  headerScrolled = signal(false);
  mobileMenuOpen = signal(false);

  // Agora os caminhos são para rotas do Angular
  navLinks = [
    { path: '/', label: 'Início' },
    { path: '/blog', label: 'Blog' },
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

  trackByPath(index: number, link: any): string {
    return link.path;
  }
}
