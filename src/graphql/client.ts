import { Client, cacheExchange, fetchExchange } from 'urql';

export const RICK_AND_MORTY_API = 'https://rickandmortyapi.com/graphql';

/**
 * urql's default document cache is enough here: the character list is read-only
 * and never invalidated by anything we do, so there is no reason to reach for
 * the normalized cache (graphcache).
 */
export const client = new Client({
  url: RICK_AND_MORTY_API,
  exchanges: [cacheExchange, fetchExchange],
});
