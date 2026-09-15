import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://rickandmortyapi.com/graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  // Lets codegen run before any operations exist, and while one is mid-edit.
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        // Fragment masking on: a component that declares a fragment can only
        // read the fields it declared, via getFragmentData().
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      config: {
        // Emit `import type { ... }` so the generated files satisfy
        // verbatimModuleSyntax, which the rest of the project uses.
        useTypeImports: true,
      },
    },
  },
};

export default config;
