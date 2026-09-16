import { Client, cacheExchange, fetchExchange } from 'urql';

export const RICK_AND_MORTY_API = 'https://rickandmortyapi.com/graphql';

export const client = new Client({
  url: RICK_AND_MORTY_API,
  exchanges: [cacheExchange, fetchExchange],
});
