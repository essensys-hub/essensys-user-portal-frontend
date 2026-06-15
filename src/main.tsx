import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initNewRelic } from './observability/newrelic';
import './index.css';

initNewRelic();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
