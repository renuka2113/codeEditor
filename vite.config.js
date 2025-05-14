import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // use current folder as root
  base: './', // relative paths in built files
  build: {
    outDir: 'dist', // output directory for Vite build
    emptyOutDir: true,
  },
});
