import type { Page } from '@playwright/test';

export interface RecordedCall {
  method: string;
  url: string;
  body: unknown;
}

declare global {
  interface Window {
    __e2eCalls: RecordedCall[];
  }
}

/** Variantes de la session simulée (voir `DemoSessionVariant` dans src/mockFetch.ts). */
export type SessionVariant =
  | 'gateway-online'
  | 'gateway-offline-armoire-seen'
  | 'all-offline'
  | 'no-gateway-seen'
  | 'no-gateway-old'
  | 'none';

/**
 * Garde no-armoire : toute requête hors localhost est bloquée, et le fetch simulé du mode démo
 * est enveloppé pour enregistrer les écritures (POST/PUT) vers /api/portal. `session` choisit la
 * session simulée (avec ou sans gateway, armoire vue ou ancienne) ; avec `withoutState`, la
 * table d'échange ne renvoie pas l'indice 440 (installation sans gateway).
 */
export async function noArmoire(
  page: Page,
  opts: { session?: SessionVariant; withoutState?: boolean } = {},
): Promise<string[]> {
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      external.push(url.host);
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript((variant: string) => {
    sessionStorage.setItem('essensys_demo_session', variant);
  }, opts.session ?? 'gateway-online');
  await page.addInitScript(({ withoutState }: { withoutState: boolean }) => {
    const native = window.fetch.bind(window);
    const passthrough = new WeakSet<object>();
    let inner: typeof window.fetch = native;
    window.__e2eCalls = [];
    const wrapper = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Repli du mock (URL non simulée) : il rappelle le fetch d'origine avec le même init.
      if (init && passthrough.has(init)) return native(input, init);
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/api/portal') && (method === 'POST' || method === 'PUT')) {
        window.__e2eCalls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null });
      }
      const marked: RequestInit = { ...(init ?? {}) };
      passthrough.add(marked);
      const res = await inner(input, marked);
      if (withoutState && url.includes('/api/portal/exchange')) {
        const data = await res.json();
        data.values = (data.values ?? []).filter((row: { k: number }) => row.k !== 440);
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return res;
    };
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      get: () => wrapper,
      set: (v: typeof window.fetch) => {
        inner = v;
      },
    });
  }, { withoutState: opts.withoutState ?? false });
  return external;
}

export const recordedCalls = (page: Page): Promise<RecordedCall[]> => page.evaluate(() => window.__e2eCalls);
