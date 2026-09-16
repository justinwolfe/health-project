import styles from './App.module.css';
import { Board } from './features/board/Board';

export function App() {
  return (
    <main className={styles.page}>
      <Board
        header={
          <header>
            <h1 className={styles.title}>
              <span className={styles.titleLine} data-text="Rick and Morty's">
                Rick and Morty's
              </span>{' '}
              <span className={styles.titleLine} data-text="Stuff To Do">
                Stuff To Do
              </span>
            </h1>
          </header>
        }
      />
    </main>
  );
}
