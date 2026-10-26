/**
 * Armoire en ligne avec ou sans gateway (armoire-online-sans-gateway-2026-10-012), portail cloud en démo.
 * NR: NR-portal-frontend-9 essensys-hub/essensys-user-portal-frontend#35
 * Le cas « sans gateway, armoire vue » est le signalement du 2026-10-26 (essensys-hub/essensys-feature-lifecycle#37).
 */
import { test, expect, type Page } from '@playwright/test';
import { noArmoire, type SessionVariant } from './noArmoire';

/** Tableau de bord, Scénarios et carte « Prises de sécurité » suivent la même règle. */
async function expectOnline(page: Page, online: boolean) {
  await page.goto('/dashboard');
  await expect(page.getByText(online ? 'Armoire en ligne' : 'Armoire hors ligne', { exact: false }).first()).toBeVisible();

  await page.goto('/scenarios');
  const message = page.getByText('Armoire hors ligne — lancement et édition indisponibles.');
  if (online) {
    await expect(page.getByRole('button', { name: 'Lancer' }).first()).toBeEnabled();
    await expect(message).toHaveCount(0);
  } else {
    // Hors ligne, la liste n'est pas chargée : le message est affiché et aucun « Lancer » n'est actif.
    await expect(message).toBeVisible();
    await expect(page.locator('button:not([disabled])', { hasText: 'Lancer' })).toHaveCount(0);
  }

  await page.goto('/security');
  const outlets = page.getByTestId('security-outlets');
  await expect(outlets).toBeVisible();
  const cut = outlets.getByRole('button', { name: 'Couper', exact: true });
  if (online) await expect(cut).toBeEnabled();
  else await expect(cut).toBeDisabled();
}

async function check(page: Page, variant: SessionVariant, online: boolean) {
  const external = await noArmoire(page, { session: variant });
  await expectOnline(page, online);
  expect(external).toEqual([]);
}

// Titres littéraux : la gate de couverture les lit dans le source.
test('@nr NR-portal-frontend-9 avec gateway en ligne', async ({ page }) => check(page, 'gateway-online', true));
test('@nr NR-portal-frontend-9 gateway hors ligne armoire vue', async ({ page }) => check(page, 'gateway-offline-armoire-seen', true));
test('@nr NR-portal-frontend-9 gateway et armoire hors ligne', async ({ page }) => check(page, 'all-offline', false));
test('@nr NR-portal-frontend-9 sans gateway armoire vue en ligne', async ({ page }) => check(page, 'no-gateway-seen', true));
test('@nr NR-portal-frontend-9 sans gateway armoire ancienne hors ligne', async ({ page }) => check(page, 'no-gateway-old', false));
test('@nr NR-portal-frontend-9 sans gateway ni armoire hors ligne', async ({ page }) => check(page, 'none', false));
