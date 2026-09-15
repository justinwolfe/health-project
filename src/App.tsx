import { useQuery } from 'urql';

import styles from './App.module.css';
import { CharacterChip } from './features/characters/CharacterChip';
import { CharactersQuery } from './graphql/characters';

/**
 * SCAFFOLD ONLY. This panel exists to prove the urql + codegen + fragment
 * masking path works end to end against the live API. It gets replaced by the
 * Board (three columns) and the create-card form.
 */
export function App() {
  const [{ data, fetching, error }] = useQuery({ query: CharactersQuery, variables: { page: 1 } });

  const characters = data?.characters?.results ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kanban</h1>
        <p className={styles.subtitle}>Scaffold check — Rick and Morty API via urql</p>
      </header>

      <section className={styles.panel} aria-labelledby="api-check">
        <h2 className={styles.panelTitle} id="api-check">
          Characters
        </h2>

        {fetching ? <p className={styles.status}>Loading…</p> : null}
        {error ? <p className={styles.error}>Request failed: {error.message}</p> : null}

        {!fetching && !error ? (
          <>
            <p className={styles.status}>
              {data?.characters?.info?.count ?? 0} characters available, showing page 1.
            </p>
            <ul className={styles.chipList}>
              {characters.map((character) =>
                character ? (
                  <li key={character.id}>
                    <CharacterChip character={character} />
                  </li>
                ) : null,
              )}
            </ul>
          </>
        ) : null}
      </section>
    </main>
  );
}
