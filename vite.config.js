import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Port you might want, standard Vite port is 5173
    port: 5173,
    // If you run a local backend (e.g. via vercel dev on another port),
    // you can proxy it here. Below is a commented example:
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   }
    // }
  },
  build: {
    outDir: 'dist',
  }
});
