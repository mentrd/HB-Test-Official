import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// 相對路徑讓同一份產出可放在 GitHub Pages 的使用者站或專案站子路徑。
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        demo: resolve(import.meta.dirname, 'demo/index.html'),
      },
    },
  },
});
