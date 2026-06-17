import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Tokens (variables + base reset) load FIRST so component default styles
// cascade correctly. AppShell.css loads second to lay out the shell, then
// component.css for .button/.panel/etc. used by the refactored pages.
import './styles/tokens.css';
import './styles/shell.css';
import './styles/components.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
