import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { getFragmentData } from '../../gql';
import { CharacterPickerOptionFragment } from './CharacterPicker.graphql';
import styles from './CharacterPicker.module.css';
import type { LoadedCharacter } from './types';
import { useCharacterSearch } from './useCharacterSearch';

type Props = {
  /** Id for the input, so the caller's <label htmlFor> points at it. */
  inputId: string;
  value: LoadedCharacter | null;
  onChange: (character: LoadedCharacter | null) => void;
};

/**
 * An editable combobox with list autocomplete, per the ARIA 1.2 pattern:
 * <input role="combobox"> keeps DOM focus at all times, and the highlighted
 * option is communicated with aria-activedescendant rather than by moving focus
 * — the user has to be able to keep typing while stepping through results.
 *
 * Search runs on the server, so the list is not limited to one page of
 * characters. When there are more matches than are loaded, the last row is a
 * "load more" option: giving it role="option" keeps it reachable by the same
 * arrow keys and stops screen readers switching interaction mode partway
 * through the list.
 */
export function CharacterPicker({ inputId, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  // -1 means "no option highlighted"; the input's own text is the active value.
  const [activeIndex, setActiveIndex] = useState(-1);

  const { characters, total, hasMore, loadMore, fetching, pending } = useCharacterSearch(query);

  const listboxId = useId();
  const statusId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const options = getFragmentData(CharacterPickerOptionFragment, characters);
  const loadMoreIndex = hasMore ? options.length : -1;
  const lastIndex = hasMore ? options.length : options.length - 1;

  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeId = open && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  function select(index: number) {
    if (index === loadMoreIndex) {
      // Keep the list open and land on the first row about to arrive.
      setActiveIndex(options.length);
      loadMore();
      return;
    }

    const chosen = characters[index];
    const option = options[index];
    if (!chosen || !option) return;

    onChange(chosen);
    setQuery(option.name ?? '');
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
          return;
        }
        setActiveIndex(activeIndex >= lastIndex ? lastIndex : activeIndex + 1);
        return;

      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(lastIndex);
          return;
        }
        setActiveIndex(activeIndex <= 0 ? 0 : activeIndex - 1);
        return;

      case 'Home':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(0);
        return;

      case 'End':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(lastIndex);
        return;

      case 'Enter':
        if (!open || activeIndex < 0) return;
        // Without this the keypress would submit the surrounding form.
        event.preventDefault();
        select(activeIndex);
        return;

      case 'Escape':
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        return;

      case 'Tab':
        setOpen(false);
        setActiveIndex(-1);
        return;

      default:
        return;
    }
  }

  function handleInput(next: string) {
    setQuery(next);
    setOpen(true);
    // Dropping the highlight while typing is not cosmetic: NVDA stops
    // announcing typed and deleted characters while a virtual focus is set.
    setActiveIndex(-1);
    // The text no longer describes the chosen character, so nothing is chosen.
    if (value) onChange(null);
  }

  // Close when focus or a click goes elsewhere.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // Keep the highlighted row visible when arrowing past the visible window.
  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const selected = value ? getFragmentData(CharacterPickerOptionFragment, value) : null;

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.field}>
        {selected?.image ? (
          <img
            className={styles.selectedAvatar}
            src={selected.image}
            alt=""
            width={24}
            height={24}
          />
        ) : null}

        <input
          className={styles.input}
          id={inputId}
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => handleInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder="Search characters…"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={statusId}
          {...(activeId ? { 'aria-activedescendant': activeId } : {})}
        />
      </div>

      {open ? (
        <ul
          className={styles.listbox}
          id={listboxId}
          role="listbox"
          aria-busy={fetching || pending}
        >
          {options.map((option, index) => (
            <li
              key={`${option.id}-${index}`}
              className={
                index === activeIndex ? `${styles.option} ${styles.active}` : styles.option
              }
              id={optionId(index)}
              role="option"
              // On the highlighted row rather than only a chosen one: Chrome +
              // VoiceOver only announce the active option when it is selected.
              aria-selected={index === activeIndex}
              // Pointer down would blur the input and close the list before the
              // click ever lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(index)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.image ? (
                <img className={styles.avatar} src={option.image} alt="" width={32} height={32} />
              ) : (
                <span className={styles.avatarFallback} aria-hidden="true" />
              )}
              <span className={styles.name}>{option.name}</span>
              <span className={styles.meta}>
                {[option.species, option.status].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}

          {hasMore ? (
            <li
              className={
                activeIndex === loadMoreIndex
                  ? `${styles.loadMore} ${styles.active}`
                  : styles.loadMore
              }
              id={optionId(loadMoreIndex)}
              role="option"
              aria-selected={activeIndex === loadMoreIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(loadMoreIndex)}
              onMouseEnter={() => setActiveIndex(loadMoreIndex)}
            >
              Load more ({options.length} of {total})
            </li>
          ) : null}

          {options.length === 0 && !fetching && !pending ? (
            <li className={styles.empty}>No characters match “{query}”.</li>
          ) : null}
        </ul>
      ) : null}

      {/* Announces result counts without stealing focus or interrupting typing. */}
      <div className={styles.status} id={statusId} role="status">
        {open
          ? describeResults({ count: options.length, total, fetching: fetching || pending })
          : ''}
      </div>
    </div>
  );
}

function describeResults({
  count,
  total,
  fetching,
}: {
  count: number;
  total: number;
  fetching: boolean;
}) {
  if (fetching) return 'Searching characters.';
  if (count === 0) return 'No characters found.';
  if (total > count) return `${count} of ${total} characters shown.`;
  return `${count} ${count === 1 ? 'character' : 'characters'} found.`;
}
