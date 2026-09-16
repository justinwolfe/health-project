import { graphql } from '../../../graphql/generated';

/**
 * The data requirement for <CharacterChip />, kept next to it rather than in the
 * query that uses it. With fragment masking on, the component can only read the
 * fields listed here.
 *
 * It lives in its own module because a file that exports a component must export
 * nothing else for Fast Refresh to work (see eslint-plugin-react-refresh).
 */
export const CharacterChipFragment = graphql(`
  fragment CharacterChip on Character {
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
