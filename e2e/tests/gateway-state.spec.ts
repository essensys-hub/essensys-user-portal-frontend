/**
 * Présence de la gateway dans le portail cloud (sonnette-plages-push-2026-11-008), en démo.
 * NR: NR-portal-frontend-14 essensys-hub/essensys-feature-lifecycle#61
 * Cloud factice : aucune armoire réelle, aucun cloud réel (garde no-armoire de ./noArmoire).
 */
import { test, expect } from '@playwright/test';
import { noArmoire, type GatewayStateOverride, type SessionVariant } from './noArmoire';

async function check(
  page: import('@playwright/test').Page,
  opts: { session?: SessionVariant; gatewayState?: GatewayStateOverride },
  expected: string | RegExp,
) {
  const external = await noArmoire(page, opts);
  for (const path of ['/dashboard', '/settings']) {
    await page.goto(path);
    await expect(page.getByTestId('gateway-state')).toHaveText(expected);
  }
  expect(external).toEqual([]);
}

// Titres littéraux : la gate de couverture les lit dans le source.
test('@nr NR-portal-frontend-14 gateway_state online : Gateway en ligne', async ({ page }) =>
  check(page, { session: 'gateway-online', gatewayState: 'online' }, 'Gateway en ligne'));

test('@nr NR-portal-frontend-14 gateway_state offline : Gateway hors ligne', async ({ page }) =>
  check(page, { session: 'gateway-online', gatewayState: 'offline' }, 'Gateway hors ligne'));

test('@nr NR-portal-frontend-14 gateway_state none : Aucune gateway liée', async ({ page }) =>
  check(page, { session: 'no-gateway-seen', gatewayState: 'none' }, 'Aucune gateway liée'));

test('@nr NR-portal-frontend-14 gateway_state none l emporte sur un bloc gateway', async ({ page }) =>
  check(page, { session: 'gateway-online', gatewayState: 'none' }, 'Aucune gateway liée'));

test('@nr NR-portal-frontend-14 champ absent : affichage du bloc gateway conserve', async ({ page }) => {
  const external = await noArmoire(page, { session: 'gateway-online', gatewayState: 'absent' });
  await page.goto('/dashboard');
  await expect(page.getByTestId('gateway-state')).toHaveCount(0);
  await expect(page.getByText('Gateway demo-gateway en ligne')).toBeVisible();
  expect(external).toEqual([]);
});

test('@nr NR-portal-frontend-14 champ absent sans gateway : aucun libelle de gateway', async ({ page }) => {
  const external = await noArmoire(page, { session: 'no-gateway-seen', gatewayState: 'absent' });
  await page.goto('/dashboard');
  await expect(page.getByText('Armoire Essensys')).toBeVisible();
  await expect(page.getByTestId('gateway-state')).toHaveCount(0);
  await expect(page.getByText(/Gateway .* ligne|Aucune gateway liée/)).toHaveCount(0);
  expect(external).toEqual([]);
});
