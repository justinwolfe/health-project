import { useId, useState, type FormEvent } from 'react';

import { CharacterPicker } from '../characters/CharacterPicker';
import type { LoadedCharacter } from '../characters/types';
import styles from './NewCardForm.module.css';

type Props = {
  onCreate: (input: { title: string; character: LoadedCharacter }) => void;
};

export function NewCardForm({ onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [character, setCharacter] = useState<LoadedCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a successful submit and used as the picker's key, which resets
  // its search text along with the selection. Without it the field would still
  // read "Rick Sanchez" while nothing is actually selected.
  const [pickerGeneration, setPickerGeneration] = useState(0);

  const titleId = useId();
  const characterId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give the card a title.');
      return;
    }
    // The brief requires every card to have a character.
    if (!character) {
      setError('Pick a character for this card.');
      return;
    }

    onCreate({ title: trimmed, character });
    setTitle('');
    setCharacter(null);
    setError(null);
    setPickerGeneration((generation) => generation + 1);
  }

  return (
    // noValidate suppresses the browser's own validation bubbles so both rules
    // are reported the same way, in the live region below. `required` stays on
    // the title because it is also what marks it required to screen readers.
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
        <label className={styles.label} htmlFor={characterId}>
          Character
        </label>
        <CharacterPicker
          key={pickerGeneration}
          inputId={characterId}
          value={character}
          onChange={setCharacter}
        />
      </div>

      <button className={styles.submit} type="submit">
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
