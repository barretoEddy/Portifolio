import { Routes } from '@angular/router';

export const routes: Routes = [
  // A rota principal que carrega o nosso portfólio
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
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
