import { graphql } from '../gql';

/**
 * The ...CharacterChip spread is resolved by codegen, which scans every file in
 * `documents` and builds one registry of operations and fragments. That is why
 * the fragment can live next to the component that needs it rather than here.
 */
export const CharactersQuery = graphql(`
  query Characters($page: Int) {
    characters(page: $page) {
      info {
        count
        pages
        next
      }
      results {
        id
        ...CharacterChip
      }
    }
  }
`);
