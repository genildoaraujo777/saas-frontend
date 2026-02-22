import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true, 
    allowedHosts: [
      'fbmstore.com.br',
      '.fbmstore.com.br' // Isso libera todos os subdomínios no Vite
    ],
  },
  resolve: {
    alias: { 
      '@': path.resolve(__dirname, 'src'), 
    }
  }
});
