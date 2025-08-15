import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SanityService, Post } from '../../services/sanity.service';
import { MarkdownModule } from 'ngx-markdown'; // Importando o MarkdownModule

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, MarkdownModule], // Adicionando MarkdownModule
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css'
})
export class BlogPostComponent implements OnInit {
  private sanityService = inject(SanityService);
  private route = inject(ActivatedRoute);

  post: Post | null = null;
  isLoading = true;

  ngOnInit(): void {
    // Usamos o 'paramMap' para ouvir mudanças na URL
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug'); // Obtemos o slug da URL
      if (slug) {
        this.fetchPost(slug);
      }
    });
  }

  async fetchPost(slug: string): Promise<void> {
    this.isLoading = true;
    this.post = await this.sanityService.getPostBySlug(slug);
    this.isLoading = false;
  }

  getPostImageUrl(source: any) {
    return this.sanityService.getImageUrl(source).width(1200).url();
  }
}
