import { graphql } from '../generated';

/**
 * The fragment spreads are resolved by codegen, which scans every file in
 * `documents` and builds one registry of operations and fragments. That is why
 * each fragment can live next to the component that needs it rather than here.
 *
 * `filter` is what makes the whole catalogue reachable: name search runs on the
 * server, so the picker is not limited to whichever page happens to be loaded.
 *
 * `id` is selected alongside the spreads because the board indexes characters
 * by id, and masked fragment data is not readable from here.
 */
export const CharactersQuery = graphql(`
  query Characters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info {
        count
        pages
        next
      }
      results {
        id
        ...CharacterChip
        ...CharacterPickerOption
      }
    }
  }
`);
