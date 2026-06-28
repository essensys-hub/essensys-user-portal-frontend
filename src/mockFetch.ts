import { handleMockScenarioRequest } from './mockScenarios';

const originalFetch = window.fetch;

export function setupMocks() {
  console.log('[MOCK] Portail demo — mocks actifs (zéro action armoire)');

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = '';
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.toString();
    else if (input instanceof Request) url = input.url;

    const method = init?.method || (input instanceof Request ? input.method : 'GET');

    const jsonResponse = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

    console.log(`[MOCK] ${method} ${url}`);

    const scenarioMock = handleMockScenarioRequest(url, method);
    if (scenarioMock) return scenarioMock;

    if (url.includes('/api/portal/link-request/status') && method === 'GET') {
      return jsonResponse({
        portal_access: true,
        linked_gateway_id: 'gw-demo',
        linked_machine_id: 1,
      });
    }

    if (url.includes('/api/portal/session') && method === 'GET') {
      return jsonResponse({
        portal_access: true,
        user: {
          id: 1,
          email: 'demo@essensys.fr',
          first_name: 'Démo',
          last_name: 'Portail',
          role: 'user',
          linked_gateway_id: 'gw-demo',
        },
        gateway: { id: 'gw-demo', online: true, hostname: 'demo-gateway' },
      });
    }

    if (url.includes('/api/portal/inject') && method === 'POST') {
      const isDryRun = url.includes('test_mode=dry_run');
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (isDryRun || import.meta.env.VITE_DEMO_MODE === 'true') {
        return jsonResponse({
          status: 'test_ok',
          dry_run: true,
          message: 'Validation OK — non envoyé (mock portail)',
          validated_params: [{ k: body.k, v: String(body.v) }],
        });
      }
      return jsonResponse({ success: true, message: 'Mock injected' });
    }

    if (url.includes('/api/portal/exchange') && method === 'GET') {
      const keysParam = new URL(url, window.location.origin).searchParams.get('keys') || '';
      const values = keysParam
        .split(',')
        .filter((k) => k !== '')
        .map((k) => ({ k: parseInt(k, 10), v: '25' }));
      return jsonResponse({ values });
    }

    if (url.includes('/api/portal/web/actions') && method === 'POST') {
      return jsonResponse({ success: true, message: 'Mock action sent' });
    }

    if (url.includes('/api/portal/history/latest') && method === 'GET') {
      return jsonResponse({
        message: 'Success',
        lastAction: {
          id: 1,
          guid: 'mock-guid',
          machineId: 99,
          actionType: 'mock_type',
          actionInfo: 'Mock action executed',
          isDone: true,
          timestamp: new Date().toISOString(),
          indexes: [],
        },
      });
    }

    if (url.includes('/api/portal/gateway/status') && method === 'GET') {
      return jsonResponse({ online: true });
    }

    if (url.includes('/api/unifi/cameras') && method === 'GET' && !url.includes('/snapshot')) {
      return jsonResponse({
        cameras: [
          {
            id: 'cam-mock-1',
            name: 'Caméra démo portail',
            type: 'G3 Bullet',
            model: 'UVC G3',
            status: 'online',
            last_seen: new Date().toISOString(),
            is_recording: true,
            is_connected: true,
          },
        ],
      });
    }

    if (url.includes('/snapshot') && method === 'GET') {
      const transparentPng = Uint8Array.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
        0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
        0, 0, 0, 11, 73, 68, 65, 84, 8, 153, 99, 96, 0, 2, 0, 0, 5,
        0, 1, 255, 255, 255, 255, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
      ]);
      return new Response(transparentPng, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    }

    if (url.includes('/api/')) {
      console.warn(`[MOCK] Fallback portail pour ${method} ${url}`);
      return jsonResponse({ success: true, message: 'Mock fallback' });
    }

    return originalFetch(input, init);
  };
}
