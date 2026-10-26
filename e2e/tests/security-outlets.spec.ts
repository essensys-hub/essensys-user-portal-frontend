/**
 * Prises de sécurité (security-outlets-2026-10-011), portail cloud en mode démo.
 * NR: NR-portal-frontend-8 essensys-hub/essensys-user-portal-frontend#31
 */
import { test, expect } from '@playwright/test';
import { noArmoire, recordedCalls } from './noArmoire';

const injectBatches = async (page: Parameters<typeof recordedCalls>[0]) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/portal/inject'));

test.describe('prises de sécurité', () => {
  test('@nr NR-portal-frontend-8 couper envoie 590 et 623 a 1 apres confirmation', async ({ page }) => {
    const external = await noArmoire(page);
    await page.goto('/security');
    const card = page.getByTestId('security-outlets');
    await expect(card.getByTestId('security-outlets-state')).toHaveText('Prises pilotées');

    await card.getByRole('button', { name: 'Couper', exact: true }).click();
    expect(await injectBatches(page)).toHaveLength(0);
    await card.getByRole('button', { name: 'Confirmer la coupure' }).click();

    await expect(card.getByRole('status')).toContainText('Coupure des prises de sécurité');
    const calls = await injectBatches(page);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/api/portal/inject/batch');
    expect(calls[0].body).toEqual({ params: [{ k: 590, v: '1' }, { k: 623, v: '1' }] });
    expect(external).toEqual([]);
  });

  test('@nr NR-portal-frontend-8 retablir envoie 590 et 623 a 2', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/security');
    await page.getByTestId('security-outlets').getByRole('button', { name: 'Rétablir' }).click();
    await expect.poll(async () => (await injectBatches(page)).map((c) => c.body)).toEqual([
      { params: [{ k: 590, v: '1' }, { k: 623, v: '2' }] },
    ]);
  });

  test('@nr NR-portal-frontend-8 annuler la confirmation n envoie rien', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/security');
    const card = page.getByTestId('security-outlets');
    await card.getByRole('button', { name: 'Couper', exact: true }).click();
    await card.getByRole('button', { name: 'Annuler' }).click();
    await expect(card.getByRole('button', { name: 'Couper', exact: true })).toBeVisible();
    expect(await injectBatches(page)).toHaveLength(0);
  });

  test('@nr NR-portal-frontend-8 commandes desactivees hors ligne', async ({ page }) => {
    await noArmoire(page, { session: 'all-offline' });
    await page.goto('/security');
    const card = page.getByTestId('security-outlets');
    await expect(card.getByText('Armoire hors ligne')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Couper', exact: true })).toBeDisabled();
    await expect(card.getByRole('button', { name: 'Rétablir' })).toBeDisabled();
  });

  test('etat inconnu sans indice 440', async ({ page }) => {
    await noArmoire(page, { withoutState: true });
    await page.goto('/security');
    const card = page.getByTestId('security-outlets');
    await expect(card.getByTestId('security-outlets-state')).toHaveText('État inconnu');
    await expect(card.getByRole('button', { name: 'Rétablir' })).toBeEnabled();
  });

  test('editeur de scenarios je sors coupe les prises indice 664', async ({ page }) => {
    await noArmoire(page);
    await page.goto('/scenarios');
    await page.getByRole('button', { name: 'Éditer' }).first().click();
    await expect(page.getByText('Édition slot 2')).toBeVisible();
    await page.getByLabel('Prises de sécurité').selectOption('1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect
      .poll(async () => {
        const put = (await recordedCalls(page)).find((c) => c.method === 'PUT' && c.url.includes('/scenarios/2'));
        return (put?.body as { params?: Record<string, string> } | undefined)?.params?.['664'];
      })
      .toBe('1');
  });
});
