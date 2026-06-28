import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initNewRelic } from './observability/newrelic';
import './index.css';

if (import.meta.env.VITE_DEMO_MODE === 'true') {
  const { setupMocks } = await import('./mockFetch');
  setupMocks();
} else {
  initNewRelic();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
