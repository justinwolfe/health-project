/**
 * A fixed stand-in for the Rick and Morty characters query.
 *
 * `__typename` is present on every object because urql's document cache adds
 * __typename to outgoing queries and reads it back off the response; omitting
 * it makes the cache behave differently in tests than in the browser.
 *
 * Avatars are inline data URIs so a test run makes no network requests at all.
 */
const avatar = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="${color}"/></svg>`,
  )}`;

export const CHARACTERS = [
  { id: '1', name: 'Rick Sanchez', species: 'Human', image: avatar('#3b7dd8') },
  { id: '2', name: 'Morty Smith', species: 'Human', image: avatar('#d8a33b') },
  { id: '3', name: 'Birdperson', species: 'Alien', image: avatar('#4fa06a') },
] as const;

export const charactersResponse = {
  data: {
    characters: {
      __typename: 'Characters',
      info: { __typename: 'Info', count: CHARACTERS.length, pages: 1, next: null },
      results: CHARACTERS.map((character) => ({ __typename: 'Character', ...character })),
    },
  },
};
