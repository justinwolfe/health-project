/**
 * A fixed stand-in for the Rick and Morty character catalogue.
 *
 * Deliberately mirrors three real properties of the API:
 *   - more characters than fit on one page (20), so paging is exercised;
 *   - two characters sharing a name but separable by origin (the real API has
 *     four Rick Sanchezes, alternate-dimension versions of one person);
 *   - two characters identical in every field, separable only by id (the real
 *     API has four SEAL Team Ricks like this).
 * The named characters at the end sit beyond page 1, which is what proves
 * search reaches past whatever page happens to be loaded.
 */
const avatar = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${color}"/></svg>`,
  )}`;

type Facts = {
  name: string;
  species: string;
  status: string;
  type: string;
  origin: string;
};

const EARTH = 'Earth (C-137)';
const REPLACEMENT = 'Earth (Replacement Dimension)';

const named: Facts[] = [
  { name: 'Rick Sanchez', species: 'Human', status: 'Alive', type: '', origin: EARTH },
  { name: 'Morty Smith', species: 'Human', status: 'Alive', type: '', origin: EARTH },
  { name: 'Summer Smith', species: 'Human', status: 'Alive', type: '', origin: REPLACEMENT },
  { name: 'Beth Smith', species: 'Human', status: 'Alive', type: '', origin: REPLACEMENT },
  { name: 'Jerry Smith', species: 'Human', status: 'Alive', type: '', origin: REPLACEMENT },
  // Same name as the first, told apart by origin and status alone.
  { name: 'Rick Sanchez', species: 'Human', status: 'Dead', type: '', origin: REPLACEMENT },
  // Identical to each other in every field; only the id separates them.
  { name: 'SEAL Team Rick', species: 'Human', status: 'Dead', type: '', origin: 'unknown' },
  { name: 'SEAL Team Rick', species: 'Human', status: 'Dead', type: '', origin: 'unknown' },
];

const filler: Facts[] = Array.from({ length: 15 }, (_, index) => ({
  name: `Background Character ${index + 1}`,
  species: 'Unknown',
  status: 'unknown',
  type: '',
  origin: 'unknown',
}));

const beyondFirstPage: Facts[] = [
  { name: 'Birdperson', species: 'Alien', status: 'Dead', type: '', origin: 'Bird World' },
  { name: 'Squanchy', species: 'Alien', status: 'unknown', type: '', origin: 'unknown' },
];

const palette = ['#3b7dd8', '#d8a33b', '#4fa06a', '#a04f8e', '#4f8ea0'];

export const ALL_CHARACTERS = [...named, ...filler, ...beyondFirstPage].map((facts, index) => ({
  id: String(index + 1),
  ...facts,
  image: avatar(palette[index % palette.length] ?? '#888888'),
}));

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
        results: results.map(({ origin, ...character }) => ({
          __typename: 'Character',
          ...character,
          origin: { __typename: 'Location', name: origin },
        })),
      },
    },
  };
}
