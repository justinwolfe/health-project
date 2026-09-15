import { CharacterChip } from '../characters/CharacterChip';
import type { LoadedCharacter } from '../characters/useCharacters';
import styles from './CardView.module.css';
import type { Card } from './types';

type Props = {
  card: Card;
  /** Undefined when the assigned character is not in the loaded page. */
  character: LoadedCharacter | undefined;
  /** Renders the lifted treatment used inside the drag overlay. */
  lifted?: boolean;
};

/**
 * Presentation only, with no dnd wiring, so the same markup renders both in the
 * column and inside <DragOverlay> while a card is being dragged.
 */
export function CardView({ card, character, lifted = false }: Props) {
  const className = lifted ? `${styles.card} ${styles.lifted}` : styles.card;

  return (
    <article className={className}>
      <p className={styles.title}>{card.title}</p>
      {character ? (
        <CharacterChip character={character} />
      ) : (
        <span className={styles.missing}>Character unavailable</span>
      )}
    </article>
  );
}
