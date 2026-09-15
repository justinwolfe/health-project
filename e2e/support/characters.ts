/**
 * A fixed stand-in for the Rick and Morty character catalogue.
 *
 * Deliberately larger than one page (20) so pagination is exercised, and the
 * named characters at the end only appear on page 2 — that is what proves
 * search reaches past whatever page happens to be loaded.
 */
const avatar = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${color}"/></svg>`,
  )}`;

type Fixture = {
  id: string;
  name: string;
  species: string;
  status: string;
  image: string;
};

const leading: Array<Pick<Fixture, 'name' | 'species' | 'status'>> = [
  { name: 'Rick Sanchez', species: 'Human', status: 'Alive' },
  { name: 'Morty Smith', species: 'Human', status: 'Alive' },
  { name: 'Summer Smith', species: 'Human', status: 'Alive' },
  { name: 'Beth Smith', species: 'Human', status: 'Alive' },
  { name: 'Jerry Smith', species: 'Human', status: 'Alive' },
];

// Filler so the named page-2 characters really do sit beyond the first page.
const filler = Array.from({ length: 18 }, (_, index) => ({
  name: `Background Character ${index + 1}`,
  species: 'Unknown',
  status: 'unknown',
}));

const trailing: Array<Pick<Fixture, 'name' | 'species' | 'status'>> = [
  { name: 'Birdperson', species: 'Alien', status: 'Dead' },
  { name: 'Squanchy', species: 'Alien', status: 'unknown' },
];

const palette = ['#3b7dd8', '#d8a33b', '#4fa06a', '#a04f8e', '#4f8ea0'];

export const ALL_CHARACTERS: Fixture[] = [...leading, ...filler, ...trailing].map(
  (character, index) => ({
    id: String(index + 1),
    ...character,
    image: avatar(palette[index % palette.length] ?? '#888888'),
  }),
);

export const PAGE_SIZE = 20;

/** Mirrors the API: substring name match, 20 per page, null counts on no match. */
export function queryCharacters(name: string, page: number) {
  const matched = name
    ? ALL_CHARACTERS.filter((character) =>
        character.name.toLowerCase().includes(name.toLowerCase()),
      )
    : ALL_CHARACTERS;

  const pages = Math.ceil(matched.length / PAGE_SIZE);
  const results = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    data: {
      characters: {
        __typename: 'Characters',
        info: {
          __typename: 'Info',
          count: matched.length || null,
          pages: pages || null,
          next: page < pages ? page + 1 : null,
        },
        results: results.map((character) => ({ __typename: 'Character', ...character })),
      },
    },
  };
}
