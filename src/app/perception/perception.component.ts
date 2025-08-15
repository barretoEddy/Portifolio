import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SanityService, Project } from '../services/sanity.service';

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perception.component.html',
  styleUrl: './perception.component.css'
})
export class PerceptionComponent implements OnInit {
  @Output() contentRendered = new EventEmitter<void>();

  private sanityService = inject(SanityService);

  projects: Project[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.fetchProjects();
  }

  async fetchProjects(): Promise<void> {
    this.isLoading = true;
    try {
      this.projects = await this.sanityService.getProjects();
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.contentRendered.emit();
      }, 0);
    }
  }

  getProjectImageUrl(source: any) {
    return this.sanityService.getImageUrl(source).width(800).url();
  }
}
