import { graphql } from '../gql';

/**
 * The fragment spreads are resolved by codegen, which scans every file in
 * `documents` and builds one registry of operations and fragments. That is why
 * each fragment can live next to the component that needs it rather than here.
 *
 * `id` is selected alongside the spreads because the board looks characters up
 * by id, and masked fragment data is not readable from here.
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
        ...CharacterOption
      }
    }
  }
`);
