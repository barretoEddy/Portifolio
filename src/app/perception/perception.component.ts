import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perception',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perception.component.html',
  styleUrl: './perception.component.css'
})
export class PerceptionComponent {

  // Seus dados de projetos
  projects = [
    {
      title: 'Nome do Projeto 1',
      description: 'Uma breve descrição sobre o projeto...',
      tech: ['Angular', 'TypeScript', 'Firebase', 'SCSS'],
      liveUrl: '#',
      repoUrl: '#'
    },
    {
      title: 'Nome do Projeto 2',
      description: 'Outro projeto incrível...',
      tech: ['React', 'Next.js', 'Vercel', 'TailwindCSS'],
      liveUrl: '#',
      repoUrl: '#'
    },
    {
      title: 'Nome do Projeto 3',
      description: 'Este projeto pode ser um aplicativo mobile...',
      tech: ['React', 'Node.js', 'MongoDB', 'Express'],
      liveUrl: '#',
      repoUrl: '#'
    }
  ];
}
