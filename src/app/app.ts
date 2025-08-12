import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// Importe todos os seus componentes de seção
import { HeaderComponent } from './header/header.component';
import { HeroComponent } from './hero/hero.component';
import { CabinComponent } from './cabin/cabin.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { PerceptionComponent } from './perception/perception.component';
import { ConclusionComponent } from './conclusion/conclusion.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    // RouterOutlet,
    HeaderComponent, // Adicionado
    HeroComponent,
    CabinComponent,
    MaintenanceComponent,
    PerceptionComponent,
    ConclusionComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  title = 'Angular_Project';
}
