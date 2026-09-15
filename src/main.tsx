import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as UrqlProvider } from 'urql';

import { App } from './App';
import { client } from './graphql/client';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <UrqlProvider value={client}>
      <App />
    </UrqlProvider>
  </StrictMode>,
);
