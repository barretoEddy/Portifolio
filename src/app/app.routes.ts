import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';

export const routes: Routes = [
  // A rota principal que carrega o portfólio
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  // Rotas de autenticação
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  // Área de contato protegida
  {
    path: 'protected-contact',
    loadComponent: () => import('./contact/protected-contact/protected-contact.component').then(m => m.ProtectedContactComponent),
    canActivate: [AuthGuard]
  },
  // Dashboard administrativo - APENAS PARA ADMINS
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AdminGuard]
  },
  // ROTA TEMPORÁRIA PARA TESTES - REMOVER EM PRODUÇÃO
  {
    path: 'test-supabase',
    loadComponent: () => import('./components/supabase-test.component').then(m => m.SupabaseTestComponent)
  },
  // A nova rota para a lista de posts do blog
  {
    path: 'blog',
    loadComponent: () =>
      import('./blog/blog-list/blog-list.component').then(m => m.BlogListComponent)
  },
  // A nova rota para um post de blog específico, usando o 'slug' como identificador
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./blog/blog-post/blog-post.component').then(m => m.BlogPostComponent)
  },
  // Rota wildcard para redirecionar qualquer URL não encontrada para a página inicial
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
