import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/graphql/generated', 'playwright-report', 'test-results'],
  },

  // Application + test sources: type-aware linting via the TS project service.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Fast Refresh only holds if a module's exports are all components.
  {
    files: ['**/*.tsx'],
    extends: [reactRefresh.configs.vite],
  },

  // Node-side files that run outside the browser.
  {
    files: ['e2e/**/*.ts', 'codegen.ts', 'vite.config.ts', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // This config file itself is plain JS and outside the TS project.
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off stylistic rules that would fight Prettier.
  prettier,
);
