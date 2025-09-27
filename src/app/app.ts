import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.html',
})
export class AppComponent implements OnInit {
  isHomePage = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Detectar mudanças de rota
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Home page inclui tanto a home quanto o blog (que não precisam de padding-top)
      this.isHomePage = event.urlAfterRedirects === '/' || 
                      event.urlAfterRedirects === '' || 
                      event.urlAfterRedirects.startsWith('/blog');
    });

    // Verificar rota inicial
    const currentUrl = this.router.url;
    this.isHomePage = currentUrl === '/' || 
                    currentUrl === '' || 
                    currentUrl.startsWith('/blog');
  }
}
