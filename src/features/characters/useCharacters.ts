import { useQuery } from 'urql';

import type { CharactersQuery } from '../../gql/graphql';
import { CharactersQuery as CharactersDocument } from '../../graphql/characters';

type QueryResults = NonNullable<NonNullable<CharactersQuery['characters']>['results']>;

/**
 * One character from the list, with a confirmed id. The schema types `id` as
 * nullable, so entries without one are dropped rather than papered over.
 *
 * The value still carries its masked fragment data, which each consumer
 * unmasks with its own fragment.
 */
export type LoadedCharacter = NonNullable<QueryResults[number]> & { id: string };

/**
 * Loads the character list once and indexes it by id.
 *
 * Only the first page is fetched: the create form offers these characters, and
 * the board looks up a card's character here. Paging or name search would be
 * the natural extension — the API supports `filter: { name: ... }`.
 *
 * No useMemo on the derived map: React Compiler memoizes it.
 */
export function useCharacters() {
  const [{ data, fetching, error }] = useQuery({
    query: CharactersDocument,
    variables: { page: 1 },
  });

  const characters: LoadedCharacter[] = [];
  const byId = new Map<string, LoadedCharacter>();

  for (const result of data?.characters?.results ?? []) {
    if (result?.id == null) continue;
    const character = { ...result, id: result.id };
    characters.push(character);
    byId.set(character.id, character);
  }

  return { characters, byId, fetching, error };
}
