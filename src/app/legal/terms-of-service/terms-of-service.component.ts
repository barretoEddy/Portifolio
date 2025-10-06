import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './terms-of-service.component.html',
  styleUrl: './terms-of-service.component.css'
})
export class TermsOfServiceComponent {
  lastUpdated = new Date('2025-10-06');
}
