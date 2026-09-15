import { graphql } from '../../gql';

/**
 * What the create-card form needs from a character: enough to label an option.
 * Separate from CharacterChipFragment because masking is per-fragment — the
 * form cannot read the chip's fields, and does not need to.
 */
export const CharacterOptionFragment = graphql(`
  fragment CharacterOption on Character {
    id
    name
  }
`);
