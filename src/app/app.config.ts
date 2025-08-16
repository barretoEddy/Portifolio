import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown'; //Markdown 

import { routes } from './app.routes'; //Routes

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    provideHttpClient(),

    provideMarkdown(), 
  ]
};
