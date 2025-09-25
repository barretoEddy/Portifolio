import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && this.authService.isAdmin()) {
      // Usuário está logado E é admin
      return true;
    }

    if (currentUser && !this.authService.isAdmin()) {
      // Usuário logado mas não é admin - redirecionar para área do usuário
      this.router.navigate(['/protected-contact']);
      return false;
    }

    // Usuário não está logado - redirecionar para login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url, adminAccess: true } });
    return false;
  }
}