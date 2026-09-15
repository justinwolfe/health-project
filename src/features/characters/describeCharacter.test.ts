import { describe, expect, it } from 'vitest';

import { describeCharacter, describeCharacters } from './describeCharacter';

const rick = {
  id: '1',
  name: 'Rick Sanchez',
  species: 'Human',
  type: '',
  status: 'Alive',
  origin: { name: 'Earth (C-137)' },
};

describe('describeCharacter', () => {
  it('joins species, sub-type and origin', () => {
    expect(
      describeCharacter({
        ...rick,
        id: '631',
        type: 'Soulless Puppet',
        origin: { name: 'Story Train' },
      }).detail,
    ).toBe('Human · Soulless Puppet · Story Train');
  });

  it('omits an empty sub-type', () => {
    expect(describeCharacter(rick).detail).toBe('Human · Earth (C-137)');
  });

  it('omits an origin the API reports as unknown', () => {
    expect(describeCharacter({ ...rick, origin: { name: 'unknown' } }).detail).toBe('Human');
  });

  it('survives missing fields entirely', () => {
    expect(describeCharacter({ id: '9' })).toEqual({ detail: '', status: 'Unknown' });
  });

  it('capitalises the API’s lower-case unknown status', () => {
    expect(describeCharacter({ ...rick, status: 'unknown' }).status).toBe('Unknown');
  });
});

describe('describeCharacters', () => {
  it('leaves distinct characters unlabelled', () => {
    const described = describeCharacters([rick, { ...rick, id: '2', name: 'Morty Smith' }]);
    expect(described.map((d) => d.disambiguator)).toEqual([null, null]);
  });

  it('separates same-named characters by origin without needing an id', () => {
    const described = describeCharacters([
      rick,
      { ...rick, id: '293', status: 'Dead', origin: { name: 'Earth (Replacement Dimension)' } },
    ]);

    expect(described.map((d) => d.disambiguator)).toEqual([null, null]);
    expect(described[0]?.detail).not.toBe(described[1]?.detail);
  });

  it('falls back to the id when every field matches', () => {
    // The four SEAL Team Ricks are identical down to the episode.
    const seal = { id: '463', name: 'SEAL Team Rick', species: 'Human', status: 'Dead' };
    const described = describeCharacters([seal, { ...seal, id: '464' }]);

    expect(described.map((d) => d.disambiguator)).toEqual(['#463', '#464']);
  });

  it('only labels the entries that actually clash', () => {
    const seal = { id: '463', name: 'SEAL Team Rick', species: 'Human', status: 'Dead' };
    const described = describeCharacters([rick, seal, { ...seal, id: '464' }]);

    expect(described.map((d) => d.disambiguator)).toEqual([null, '#463', '#464']);
  });
});
