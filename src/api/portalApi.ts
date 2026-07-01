import { noticePortalError } from '../observability/newrelic';
import { supportLoginUrl } from '../siteOrigins';
import { testModeHeaders, withTestModeQuery } from '../testMode';

const TOKEN_KEY = 'essensys_token';

/** Support-site login stores JWT in adminToken (localStorage or sessionStorage). */
export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY)
  || localStorage.getItem('adminToken')
  || sessionStorage.getItem('adminToken');

/**
 * Persist OAuth token from the URL fragment (#token=...&role=...) after a
 * provider redirect. The token is delivered in the fragment (not the query
 * string) so it is never sent to the server, written to access logs, or leaked
 * via the Referer header. A legacy ?token= query is still accepted for
 * backward compatibility and stripped immediately.
 */
export const captureTokenFromURL = (): void => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const urlToken = hashParams.get('token') || queryParams.get('token');
  if (!urlToken) {
    return;
  }
  sessionStorage.setItem('adminToken', urlToken);
  const role = hashParams.get('role') || queryParams.get('role');
  if (role) {
    sessionStorage.setItem('adminRole', role);
  }
  // Strip both the fragment and any legacy ?token= from the visible URL.
  queryParams.delete('token');
  queryParams.delete('role');
  const qs = queryParams.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
  window.history.replaceState({}, '', next);
};

export const portalFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(testModeHeaders(init.headers));
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  const url = withTestModeQuery(`/api/portal${path}`);
  try {
    const res = await fetch(url, { ...init, headers });
    if (res.status >= 500) {
      noticePortalError(new Error(`HTTP ${res.status}`), path, res.status);
    }
    return res;
  } catch (err) {
    noticePortalError(err, path);
    throw err;
  }
};

export interface LinkStatusResponse {
  portal_access: boolean;
  link_request?: {
    status: string;
    machine_serial: string;
    message?: string | null;
    created_at?: string;
  };
  linked_gateway_id?: string | null;
  linked_machine_id?: number | null;
  linked_armoire_id?: number | null;
}

export interface PortalUserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  linked_machine_id?: number | null;
  linked_gateway_id?: string | null;
  linked_armoire_id?: number | null;
}

export interface PortalGatewayInfo {
  id: string;
  hostname?: string;
  ip?: string;
  online: boolean;
  last_seen?: string;
}

export interface PortalArmoireInfo {
  id: number;
  no_serie: string;
  ip: string;
  last_seen?: string;
  geo_location?: string;
  remote: boolean;
}

export interface PortalSessionResponse {
  user: PortalUserInfo;
  portal_access: boolean;
  gateway?: PortalGatewayInfo | null;
  armoire?: PortalArmoireInfo | null;
}

export const fetchPortalSession = async (): Promise<PortalSessionResponse> => {
  const res = await portalFetch('/session');
  if (!res.ok) {
    throw new Error('session failed');
  }
  return res.json();
};

export const fetchLinkStatus = async (): Promise<LinkStatusResponse> => {
  const res = await portalFetch('/link-request/status');
  if (!res.ok) {
    throw new Error('status failed');
  }
  return res.json();
};

export const submitLinkRequest = async (machineSerial: string, message: string): Promise<void> => {
  const res = await portalFetch('/link-request', {
    method: 'POST',
    body: JSON.stringify({ machine_serial: machineSerial, message }),
  });
  if (!res.ok) {
    throw new Error('request failed');
  }
};

export const injectOrder = async (k: number, v: string): Promise<void> => {
  const res = await portalFetch('/inject', {
    method: 'POST',
    body: JSON.stringify({ k, v: String(v) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'inject failed');
  }
};

export const fetchGatewayOnline = async (): Promise<boolean> => {
  const res = await portalFetch('/gateway/status');
  if (!res.ok) {
    return false;
  }
  const data = await res.json();
  return Boolean(data.online);
};

/** Efface le JWT support-site / portail (mêmes clés que Login.jsx). */
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRole');
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminRole');
  window.dispatchEvent(new Event('auth-change'));
};

/** Déconnexion → page login support-site avec retour portail. */
export const logout = (): void => {
  clearAuth();
  window.location.href = supportLoginUrl();
};
