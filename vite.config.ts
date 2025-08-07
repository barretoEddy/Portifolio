import { defineConfig } from 'vite';
import angular from '@angular/build/plugins/vite';

export default defineConfig({
  plugins: [
    angular(),
  ],
  // You can add other Vite configurations here if needed
});
