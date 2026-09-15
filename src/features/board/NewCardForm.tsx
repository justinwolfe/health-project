import { useId, useState, type FormEvent } from 'react';

import { getFragmentData } from '../../gql';
import type { LoadedCharacter } from '../characters/useCharacters';
import { CharacterOptionFragment } from './NewCardForm.graphql';
import styles from './NewCardForm.module.css';

type Props = {
  characters: LoadedCharacter[];
  loading: boolean;
  onCreate: (input: { title: string; characterId: string }) => void;
};

export function NewCardForm({ characters, loading, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();
  const characterFieldId = useId();

  // Unmasking the whole list at once rather than per <option>: an <option> is
  // not a component, so there is nowhere else to read the fragment.
  const options = getFragmentData(CharacterOptionFragment, characters);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give the card a title.');
      return;
    }
    // The brief requires every card to have a character.
    if (!characterId) {
      setError('Pick a character for this card.');
      return;
    }

    onCreate({ title: trimmed, characterId });
    setTitle('');
    setCharacterId('');
    setError(null);
  }

  return (
    // noValidate suppresses the browser's own validation bubbles so both rules
    // are reported the same way, in the live region below. `required` stays on
    // the fields because it is also what marks them required to screen readers.
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Add a card" noValidate>
      <div className={`${styles.field} ${styles.titleField}`}>
        <label className={styles.label} htmlFor={titleId}>
          Title
        </label>
        <input
          className={styles.input}
          id={titleId}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs doing?"
          autoComplete="off"
          required
        />
      </div>

      <div className={`${styles.field} ${styles.characterField}`}>
        <label className={styles.label} htmlFor={characterFieldId}>
          Character
        </label>
        <select
          className={styles.select}
          id={characterFieldId}
          value={characterId}
          onChange={(event) => setCharacterId(event.target.value)}
          disabled={loading}
          required
        >
          <option value="">{loading ? 'Loading characters…' : 'Choose a character'}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id ?? ''}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <button className={styles.submit} type="submit" disabled={loading}>
        Add card
      </button>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
