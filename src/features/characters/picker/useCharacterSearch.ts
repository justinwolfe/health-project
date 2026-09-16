import { useState } from 'react';
import { useQuery } from 'urql';

import { CharactersQuery } from '../../../graphql/queries/characters';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { toLoadedCharacters, type LoadedCharacter } from '../types';

const DEBOUNCE_MS = 250;

/**
 * Searches characters by name on the server and pages through the results.
 *
 * Name filtering is done by the API rather than in the browser, so every
 * character is reachable without downloading the whole catalogue first.
 */
export function useCharacterSearch(rawQuery: string) {
  const query = useDebouncedValue(rawQuery.trim(), DEBOUNCE_MS);

  const [page, setPage] = useState(1);

  // A new search term always starts from page 1. `appliedQuery` remembers which
  // term the current page belongs to, so we can tell when the term changed and
  // reset before the query below runs. It also stops the reset from repeating:
  // once updated, the terms match on the re-render.
  const [appliedQuery, setAppliedQuery] = useState(query);
  if (appliedQuery !== query) {
    setAppliedQuery(query);
    setPage(1);
  }

  const [{ data, fetching, error, operation }, reexecuteQuery] = useQuery({
    query: CharactersQuery,
    variables: { page, filter: query ? { name: query } : undefined },
  });

  // Which request this data actually answers. urql keeps the previous response
  // visible while the next one is in flight, so trusting `page` here instead
  // would append page 1's rows again the moment page 2 was requested.
  const resultQuery = operation?.variables.filter?.name ?? '';
  const resultPage = operation?.variables.page ?? 1;
  const resultKey = `${resultQuery}|${resultPage}`;
  const isCurrent = resultQuery === query;

  const results = data?.characters?.results;
  const info = data?.characters?.info;

  // The picker shows every page loaded so far, so responses are accumulated
  // here: page 1 replaces the list, later pages extend it. `key` records which
  // response was last applied, so each one is added exactly once even though
  // this check runs on every render.
  const [loaded, setLoaded] = useState<{
    query: string;
    key: string;
    items: LoadedCharacter[];
    total: number;
    hasMore: boolean;
  }>({
    query: '',
    key: '',
    items: [],
    total: 0,
    hasMore: false,
  });

  if (results && isCurrent && loaded.key !== resultKey) {
    setLoaded((previous) => {
      const nextItems = toLoadedCharacters(results);
      const replacesResults = resultPage === 1 || previous.query !== resultQuery;

      return {
        query: resultQuery,
        key: resultKey,
        items: replacesResults ? nextItems : [...previous.items, ...nextItems],
        total: info?.count ?? (replacesResults ? nextItems.length : previous.total),
        hasMore: info?.next != null,
      };
    });
  }

  const pending = rawQuery.trim() !== query;
  // Never show a previous query's rows beneath newly typed text. Besides being
  // visually misleading, those rows would still be selectable during debounce.
  const loadedQueryIsVisible = !pending && loaded.query === query;
  const currentError = isCurrent ? error : undefined;

  return {
    characters: loadedQueryIsVisible ? loaded.items : [],
    /** Total matches on the server, not the number currently loaded. */
    total: loadedQueryIsVisible ? loaded.total : 0,
    hasMore: loadedQueryIsVisible && !currentError && loaded.hasMore,
    loadMore: () => setPage((current) => current + 1),
    fetching,
    error: currentError,
    retry: () => reexecuteQuery({ requestPolicy: 'network-only' }),
    /** True while the user has typed something we have not searched for yet. */
    pending,
  };
}
