import { getToken } from '../api/portalApi';
import type { DryRunResponse } from '../testMode';
import { dryRunHeaders, withDryRunQuery } from './dryRunFetch';
import type { RegressionClient } from './types';

function authHeaders(): Headers {
  const headers = dryRunHeaders();
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function parseDryRun(res: Response): Promise<DryRunResponse> {
  const data = (await res.json()) as DryRunResponse;
  if (!res.ok && data.status !== 'test_failed') {
    throw new Error(data.message ?? `HTTP ${res.status}`);
  }
  return data;
}

export const portalRegressionClient: RegressionClient = {
  async injectDryRun(k, v) {
    const res = await fetch(withDryRunQuery('/api/portal/inject'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ k, v }),
    });
    return parseDryRun(res);
  },

  async listScenarios() {
    const res = await fetch('/api/portal/scenarios', { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Liste scénarios : HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.slots ?? [];
  },

  async readExchange(keys) {
    const res = await fetch(
      withDryRunQuery(`/api/portal/exchange?keys=${keys.join(',')}`),
      { headers: authHeaders() },
    );
    if (!res.ok) {
      throw new Error(`Exchange : HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.values ?? [];
  },
};
