import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { captureTokenFromURL } from './api/portalApi';
import App from './App';

captureTokenFromURL();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/portal">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
