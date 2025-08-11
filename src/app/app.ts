import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero/hero.component';
import { PerceptionComponent } from './perception/perception.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { CabinComponent } from './cabin/cabin.component';
import { ConclusionComponent } from './conclusion/conclusion.component';

@Component({ // Include CommonModule and the section components
  standalone: true, 
  selector: 'app-root',
  imports: [
    HeroComponent,
    PerceptionComponent,
    MaintenanceComponent,
    CabinComponent,
    ConclusionComponent,
    CommonModule
  ], // Include CommonModule and the section components
  template: `
 <app-hero></app-hero>
    <app-perception></app-perception>
    <app-maintenance></app-maintenance>
    <app-cabin></app-cabin>
    <app-conclusion></app-conclusion>
    <div class="custom-cursor"></div>
  `, // Include the section components
  styleUrls: [] // No specific styles for now // Added comma
})
export class AppComponent {}
