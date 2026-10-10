import { defineConfig, devices } from '@playwright/test';

// Captures du guide : portail en mode démo servi à la racine, aucune armoire (portal-user-guide-2026-10-006).
const PORT = 4181;

export default defineConfig({
  testDir: '.',
  testMatch: 'capture.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, colorScheme: 'light', locale: 'fr-FR', timezoneId: 'Europe/Paris' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: `VITE_DEMO_MODE=true VITE_DEMO_ROOT=true npx vite build --base / --outDir dist-guide && npx vite preview --base / --outDir dist-guide --port ${PORT} --strictPort`,
    cwd: '../..',
    url: `http://localhost:${PORT}/dashboard`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
