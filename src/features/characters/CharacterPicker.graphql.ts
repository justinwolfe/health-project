import { graphql } from '../../gql';

/** What one row of the picker's listbox shows. */
export const CharacterPickerOptionFragment = graphql(`
  fragment CharacterPickerOption on Character {
    id
    name
    image
    species
    status
  }
`);
