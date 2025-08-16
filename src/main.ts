// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { routes } from './app/app.routes';

// Importa o GSAP e o ScrollTrigger
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registra o plugin
gsap.registerPlugin(ScrollTrigger);

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
