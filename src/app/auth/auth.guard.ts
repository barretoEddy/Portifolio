import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      // Usuário está logado
      return true;
    }

    // Usuário não está logado, redirecionar para login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}