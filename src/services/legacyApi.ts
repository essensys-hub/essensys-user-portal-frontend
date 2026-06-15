/**
 * Adaptateur domotique portail distant — même API que essensys-server-frontend
 * mais inject via POST /api/portal/inject + JWT support-site.
 */
import { getToken } from '../api/portalApi';

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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    throw new AuthenticationError();
  }
};

export const sendInjection = async (k: number, v: string): Promise<void> => {
  const response = await fetch('/api/portal/inject', {
    method: 'POST',
    headers: portalHeaders(),
    body: JSON.stringify({ k, v: String(v) }),
  });
  handleAuthError(response);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Injection failed (${response.status})`);
  }
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
