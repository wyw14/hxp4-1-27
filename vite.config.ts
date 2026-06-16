import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: {
    port: 41027,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:42027',
        changeOrigin: true
      }
    }
  }
});
