import { defineConfig, devices } from '@playwright/test';

// Tests applicatifs du portail cloud en mode démo (no-armoire) : l'API est simulée dans la page,
// aucune commande ne quitte le navigateur. Matrice desktop / iPhone / iPad (GOVERNANCE /checkup).
const PORT = 4182;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, locale: 'fr-FR', timezoneId: 'Europe/Paris' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
  ],
  webServer: {
    command: `VITE_DEMO_MODE=true VITE_DEMO_ROOT=true npx vite build --base / --outDir dist-e2e && npx vite preview --base / --outDir dist-e2e --port ${PORT} --strictPort`,
    cwd: '..',
    url: `http://localhost:${PORT}/dashboard`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
