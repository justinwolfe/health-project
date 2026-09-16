/**
 * The API returns several characters sharing one name — alternate-dimension
 * versions of the same person, which is the show's premise rather than bad
 * data. 46 names are shared by two or more of the 826 characters.
 *
 * `species · status` alone cannot tell them apart: the four Rick Sanchezes
 * collapse into two labels. Origin and sub-type separate most of them, and for
 * the rest (four SEAL Team Ricks identical in every field) the id is the only
 * thing left.
 */

export type CharacterFacts = {
  /** Unused when describing one character; required to describe a list. */
  id?: string | null;
  name?: string | null;
  species?: string | null;
  type?: string | null;
  status?: string | null;
  origin?: { name?: string | null } | null;
};

export type CharacterDescription = {
  /** Species, sub-type and home dimension, e.g. "Human · Soulless Puppet · Story Train". */
  detail: string;
  /** Always capitalised, because the API sends "unknown" in lower case. */
  status: string;
};

/** The API uses this string rather than null for absent origins and statuses. */
const UNKNOWN = 'unknown';

function isKnown(value: string | null | undefined): value is string {
  return Boolean(value) && value?.trim().toLowerCase() !== UNKNOWN;
}

export function describeCharacter(character: CharacterFacts): CharacterDescription {
  const detail = [character.species, character.type, character.origin?.name]
    .filter(isKnown)
    .join(' · ');

  return {
    detail,
    status: isKnown(character.status) ? character.status : 'Unknown',
  };
}

/** Only the list-wide comparison needs an id, so only it requires one. */
export type IdentifiableCharacter = CharacterFacts & { id: string };

export type IdentifiedCharacter = CharacterDescription & {
  /** "#631" when the facts above cannot tell two of these characters apart. */
  disambiguator: string | null;
};

export function describeCharacters(
  characters: readonly IdentifiableCharacter[],
): IdentifiedCharacter[] {
  const described = characters.map((character) => {
    const description = describeCharacter(character);
    return {
      id: character.id,
      description,
      label: `${character.name ?? ''}|${description.detail}|${description.status}`,
    };
  });

  const counts = new Map<string, number>();
  for (const { label } of described) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return described.map(({ id, description, label }) => {
    const isAmbiguous = (counts.get(label) ?? 0) > 1;
    return { ...description, disambiguator: isAmbiguous ? `#${id}` : null };
  });
}
