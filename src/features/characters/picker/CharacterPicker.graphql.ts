import { graphql } from '../../../graphql/generated';

/**
 * What one row of the picker's listbox shows.
 *
 * `type` and `origin` are here to tell same-named characters apart: the API has
 * four Rick Sanchezes, and species alone cannot distinguish them.
 */
export const CharacterPickerOptionFragment = graphql(`
  fragment CharacterPickerOption on Character {
    id
    name
    image
    species
    status
    type
    origin {
      name
    }
  }
`);
