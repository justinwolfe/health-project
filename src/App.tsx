import styles from './App.module.css';
import { Board } from './features/board/Board';

export function App() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kanban</h1>
        <p className={styles.subtitle}>
          Every card gets a Rick and Morty character. Drag between columns, reorder within one, and
          finishing something is worth celebrating.
        </p>
      </header>

      <Board />
    </main>
  );
}
