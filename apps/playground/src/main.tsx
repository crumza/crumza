import { StrictMode, type ReactElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { LiquixDemo } from './LiquixDemo';

/** #liquix opens the shader stage, which owns the window and the page scroll. */
function Root(): ReactElement {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash === '#liquix' ? <LiquixDemo /> : <App />;
}

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
