import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: './', // relative paths so GitHub Pages sub-paths, Netlify and Cloudflare Pages all work
  plugins: [preact()],
});
