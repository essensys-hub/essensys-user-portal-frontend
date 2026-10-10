/**
 * Captures du guide utilisateur (portal-user-guide-2026-10-006).
 *
 * Le portail tourne en mode démo (VITE_DEMO_MODE=true) : l'API est simulée et aucune
 * commande n'atteint une armoire. Toute requête vers un hôte autre que localhost est
 * bloquée et fait échouer la capture.
 * Lancer avec : npm run docs:screenshots
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { screens, type Target } from './screens';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.join(HERE, 'images');
const LOGO = path.join(HERE, 'assets', 'logosml.png');

function locate(page: Page, target: Target): Locator {
  if ('text' in target) return page.getByText(target.text, { exact: typeof target.text === 'string' }).first();
  return page.getByRole(target.role, { name: target.name, exact: typeof target.name === 'string' }).first();
}

async function guard(page: Page, external: string[]) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      external.push(url.host);
      return route.abort();
    }
    // Le logo du portail n'est pas servi par le build (/images/logosml.png) : on fournit le logo officiel.
    if (url.pathname === '/images/logosml.png') return route.fulfill({ path: LOGO, contentType: 'image/png' });
    return route.continue();
  });
}

async function drawMarkers(page: Page, boxes: { n: number; x: number; y: number }[]) {
  await page.evaluate((items) => {
    for (const { n, x, y } of items) {
      const el = document.createElement('div');
      el.className = 'guide-marker';
      el.textContent = String(n);
      Object.assign(el.style, {
        position: 'absolute', left: `${x - 14}px`, top: `${y - 14}px`, width: '28px', height: '28px',
        borderRadius: '50%', background: '#E11D48', color: '#fff', font: '700 15px/28px system-ui, sans-serif',
        textAlign: 'center', boxShadow: '0 0 0 3px #fff, 0 2px 6px rgba(0,0,0,.35)', zIndex: '2147483647',
        pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
  }, boxes);
}

for (const screen of screens) {
  test(`capture ${screen.slug}`, async ({ page }, testInfo) => {
    const device = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';
    const external: string[] = [];
    await guard(page, external);
    await page.goto(screen.route);
    await page.waitForLoadState('networkidle');
    const boxes: { n: number; x: number; y: number }[] = [];
    for (const marker of screen.markers) {
      if (marker.only && marker.only !== device) continue;
      const el = locate(page, marker.target);
      await expect(el, `repère ${marker.n} de ${screen.slug} introuvable : mettre à jour le guide`).toBeVisible();
      const box = await el.boundingBox();
      const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
      if (!box) throw new Error(`repère ${marker.n} de ${screen.slug} sans position`);
      // Pastille à gauche de l'élément, centrée verticalement, pour ne pas masquer le texte.
      boxes.push({ n: marker.n, x: Math.max(16, box.x + scroll.x - 18), y: box.y + scroll.y + box.height / 2 });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (device === 'desktop') await drawMarkers(page, boxes);
    // Mobile : capture à la taille de l'écran (la barre de navigation fixe gâcherait une capture pleine page).
    await page.screenshot({
      path: path.join(IMAGES, `${screen.slug}-${device}.png`),
      fullPage: device === 'desktop' && (screen.fullPage ?? true),
    });
    expect(external, 'aucune requête ne doit sortir de localhost').toEqual([]);
  });
}

test('capture tableau-de-bord en thème sombre', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'une seule capture sombre suffit');
  const external: string[] = [];
  await guard(page, external);
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sombre', exact: true }).click();
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(IMAGES, 'tableau-de-bord-sombre.png'), fullPage: false });
  expect(external).toEqual([]);
});
