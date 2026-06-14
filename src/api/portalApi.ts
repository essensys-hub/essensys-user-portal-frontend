const TOKEN_KEY = 'essensys_token';

/** Support-site login stores JWT in adminToken (localStorage or sessionStorage). */
export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY)
  || localStorage.getItem('adminToken')
  || sessionStorage.getItem('adminToken');

/** Persist OAuth token from URL (?token=...) when redirect lands on /portal/. */
export const captureTokenFromURL = (): void => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (!urlToken) {
    return;
  }
  sessionStorage.setItem('adminToken', urlToken);
  params.delete('token');
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
};

export const portalFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(`/api/portal${path}`, { ...init, headers });
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
}

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
