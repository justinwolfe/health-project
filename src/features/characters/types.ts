import type { CharactersQuery } from '../../gql/graphql';

type QueryResults = NonNullable<NonNullable<CharactersQuery['characters']>['results']>;

/**
 * One character from the list query, with a confirmed id. The schema types `id`
 * as nullable, so entries without one are dropped rather than papered over.
 *
 * The value still carries its masked fragment data, which each consumer unmasks
 * with its own fragment.
 */
export type LoadedCharacter = NonNullable<QueryResults[number]> & { id: string };

export function toLoadedCharacters(results: QueryResults): LoadedCharacter[] {
  const characters: LoadedCharacter[] = [];
  for (const result of results) {
    if (result?.id == null) continue;
    characters.push({ ...result, id: result.id });
  }
  return characters;
}
