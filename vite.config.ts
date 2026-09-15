import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
// vitest/config re-exports Vite's defineConfig and adds the typed `test` key.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    // React Compiler ships as a Babel plugin. @vitejs/plugin-react v6 no longer
    // runs Babel itself (it transforms with oxc), so we add a Babel pass that
    // runs the compiler preset and nothing else. reactCompilerPreset() is the
    // plugin's helper: the compiler plugin plus a file filter for React sources.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    // Pure logic only. Anything that needs a DOM — and all drag-and-drop —
    // is covered by Playwright in e2e/, since jsdom has no layout engine and
    // cannot produce the pointer events dnd-kit's sensors rely on.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
