/**
 * Adaptateur domotique portail distant — même API que essensys-server-frontend
 * mais inject via POST /api/portal/inject + JWT support-site.
 */
import { getToken } from '../api/portalApi';
import { chunkInjectionParams } from '../heating/injectLimits';
import type { InjectionProgressEvent } from '../heating/injectionProgress';
import type { ScheduleSyncEvent } from '../heating/scheduleSync';
import { isTestModeEnabled, testModeHeaders, withTestModeQuery } from '../testMode';
import { parseInjectionResult } from '../injectionResult';

export interface InjectionBatchResult {
  totalParams: number;
  chunkCount: number;
}

export type InjectionBatchProgressHandler = (event: InjectionProgressEvent) => void;

export class AuthenticationError extends Error {
  constructor(message = 'Authentification requise') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface LegacyMapping {
  name: string;
  dindex: string;
  dvalue: string;
  openIndex?: string;
  closeIndex?: string;
  onIndex?: string;
  offIndex?: string;
}

const portalHeaders = (): HeadersInit => {
  const token = getToken();
  const base = testModeHeaders({ 'Content-Type': 'application/json' });
  const headers = new Headers(base);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const injectUrl = (path: string): string => withTestModeQuery(`/api/portal${path}`);

const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    throw new AuthenticationError();
  }
};

export const sendInjection = async (k: number, v: string): Promise<'live' | 'dry_run'> => {
  const response = await fetch(injectUrl('/inject'), {
    method: 'POST',
    headers: portalHeaders(),
    body: JSON.stringify({ k, v: String(v) }),
  });
  handleAuthError(response);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Injection failed (${response.status})`);
  }
  const data = await response.json().catch(() => null);
  const result = parseInjectionResult(data);
  if (result.kind === 'dry_run') {
    if (!isTestModeEnabled()) {
      throw new Error(
        'Commande bloquée en dry-run alors que le mode test est désactivé — vérifiez Paramètres.',
      );
    }
    return 'dry_run';
  }
  return 'live';
};

/** Envoie plusieurs indices (découpés côté serveur ; un batch par tranche ≤30 côté UI). */
export const sendInjectionBatch = async (
  items: Array<{ k: number; v: string }>,
  onProgress?: InjectionBatchProgressHandler,
): Promise<InjectionBatchResult> => {
  if (items.length === 0) {
    return { totalParams: 0, chunkCount: 0 };
  }

  const chunks = chunkInjectionParams(items);
  onProgress?.({ type: 'start', totalParams: items.length, chunkCount: chunks.length });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkIndex = i + 1;
    const keys = chunk.map(({ k }) => k);
    const indexMin = Math.min(...keys);
    const indexMax = Math.max(...keys);

    onProgress?.({
      type: 'sending',
      chunkIndex,
      chunkCount: chunks.length,
      paramsInChunk: chunk.length,
      indexMin,
      indexMax,
    });

    const response = await fetch(injectUrl('/inject/batch'), {
      method: 'POST',
      headers: portalHeaders(),
      body: JSON.stringify({ params: chunk.map(({ k, v }) => ({ k, v: String(v) })) }),
    });
    handleAuthError(response);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      onProgress?.({
        type: 'error',
        chunkIndex,
        chunkCount: chunks.length,
        message: text || `HTTP ${response.status}`,
      });
      throw new Error(text || `Batch injection failed (${response.status})`);
    }

    onProgress?.({
      type: 'success',
      chunkIndex,
      chunkCount: chunks.length,
      paramsInChunk: chunk.length,
      httpStatus: response.status,
    });
  }

  onProgress?.({ type: 'done', totalParams: items.length, chunkCount: chunks.length });
  return { totalParams: items.length, chunkCount: chunks.length };
};

/** Lecture indices table d'échange — cache cloud (gateway push) ou fallback mystatus. */
export const getExchangeValues = async (keys: number[]): Promise<Record<number, string>> => {
  const qs = keys.join(',');
  const response = await fetch(`/api/portal/exchange?keys=${qs}`, {
    headers: portalHeaders(),
  });
  handleAuthError(response);
  if (!response.ok) {
    return {};
  }
  const data: {
    values: Array<{ k: number; v: string }>;
    stale?: boolean;
    source?: string;
  } = await response.json();
  if (data.stale) {
    console.warn('[portal] exchange stale', data.source ?? 'unknown');
  }
  const out: Record<number, string> = {};
  for (const row of data.values ?? []) {
    out[row.k] = row.v;
  }
  return out;
};

/** Portail distant : lit le cache cloud (push gateway). Pas de rotation serverinfos côté OVH. */
export const syncScheduleFromArmoire = async (
  startIndex: number,
  byteCount: number,
  zoneName: string,
  onProgress?: (event: ScheduleSyncEvent) => void,
): Promise<{ values: Record<number, string>; received: number; total: number }> => {
  const endIndex = startIndex + byteCount - 1;
  onProgress?.({
    type: 'start',
    zoneName,
    startIndex,
    endIndex,
    chunksTotal: 1,
  });
  onProgress?.({
    type: 'waiting',
    received: 0,
    total: byteCount,
    chunksCompleted: 0,
    chunksTotal: 1,
  });
  const keys = Array.from({ length: byteCount }, (_, i) => startIndex + i);
  const values = await getExchangeValues(keys);
  const received = Object.keys(values).length;
  const missing = byteCount - received;
  const sampleKeys = keys.filter((k) => k in values).slice(0, 3);
  const sample = sampleKeys.map((k) => `${k}=${values[k]}`).join(', ');
  onProgress?.({ type: 'loaded', received, total: byteCount, missing, sample });
  onProgress?.({ type: 'done', received, total: byteCount, complete: received >= byteCount });
  return { values, received, total: byteCount };
};

export interface LastActionResponse {
  message?: string;
  lastAction?: {
    guid: string;
    actionType: string;
    actionInfo: string;
    isDone: boolean;
    timestamp: string;
  } | null;
}

export const getHistoryLatest = async (): Promise<LastActionResponse> => {
  const response = await fetch('/api/portal/history/latest', { headers: portalHeaders() });
  handleAuthError(response);
  if (!response.ok) {
    return { lastAction: null };
  }
  return response.json();
};

export const sendAlarmAction = async (alarmState: string, code: string): Promise<void> => {
  const response = await fetch('/api/portal/web/actions', {
    method: 'POST',
    headers: portalHeaders(),
    body: JSON.stringify({ alarme: alarmState, codealarme: code }),
  });
  handleAuthError(response);
  if (!response.ok) {
    throw new Error(await response.text().catch(() => 'alarm action failed'));
  }
};
