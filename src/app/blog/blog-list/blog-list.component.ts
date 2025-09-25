import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para usar o [routerLink]
import { SanityService, Post } from '../../services/sanity.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe], // DatePipe para formatar a data
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.complex.css'
})
export class BlogListComponent implements OnInit {
  private sanityService = inject(SanityService);

  posts: Post[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.fetchPosts();
  }

  async fetchPosts(): Promise<void> {
    this.isLoading = true;
    this.posts = await this.sanityService.getPosts();
    this.isLoading = false;
  }

  getPostImageUrl(source: any) {
    // Usamos uma largura menor para as imagens da lista
    return this.sanityService.getImageUrl(source).width(600).url();
  }

  trackByPostId(index: number, post: Post): string {
    return post._id;
  }
}
