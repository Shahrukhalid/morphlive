import { defineConfig } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';
export default defineConfig({
  root: 'apps/desktop', base: './', publicDir: 'public',
  build: { outDir: '../../dist', emptyOutDir: true },
  plugins: [{ name: 'local-vision-runtime', buildStart() {
    mkdirSync('apps/desktop/public/wasm', { recursive: true });
    cpSync('node_modules/@mediapipe/tasks-vision/wasm', 'apps/desktop/public/wasm', { recursive: true });
  } }]
});
