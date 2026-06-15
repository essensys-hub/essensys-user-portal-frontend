type NewRelicWindow = Window & {
  newrelic?: {
    setCurrentRouteName: (name: string) => void;
    noticeError: (error: Error, customAttributes?: Record<string, string | number>) => void;
  };
};

const isEnabled = (): boolean => import.meta.env.VITE_NEW_RELIC_ENABLED === 'true';

function beacons(): { beacon: string; errorBeacon: string } {
  const region = (import.meta.env.VITE_NEW_RELIC_REGION ?? 'EU').toUpperCase();
  if (region === 'EU') {
    return { beacon: 'bam.eu01.nr-data.net', errorBeacon: 'bam.eu01.nr-data.net' };
  }
  return { beacon: 'bam.nr-data.net', errorBeacon: 'bam.nr-data.net' };
}

export function initNewRelic(): void {
  if (!isEnabled()) {
    return;
  }

  const licenseKey = import.meta.env.VITE_NEW_RELIC_LICENSE_KEY;
  const applicationID = import.meta.env.VITE_NEW_RELIC_APPLICATION_ID;
  const accountID = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID;

  if (!licenseKey || !applicationID || !accountID) {
    console.warn('New Relic Browser: missing VITE_NEW_RELIC_* build variables');
    return;
  }

  void import('@newrelic/browser-agent/loaders/browser-agent').then(({ BrowserAgent }) => {
    const { beacon, errorBeacon } = beacons();
    new BrowserAgent({
      init: {
        distributed_tracing: { enabled: true },
        privacy: { cookies_enabled: true },
        ajax: { deny_list: [] },
      },
      info: {
        beacon,
        errorBeacon,
        licenseKey,
        applicationID,
        sa: 1,
      },
      loader_config: {
        accountID,
        trustKey: import.meta.env.VITE_NEW_RELIC_TRUST_KEY ?? accountID,
        agentID: import.meta.env.VITE_NEW_RELIC_AGENT_ID ?? applicationID,
        licenseKey,
        applicationID,
      },
    });
  }).catch((err: unknown) => {
    console.warn('New Relic Browser init failed', err);
  });
}

export function trackPageView(pathname: string): void {
  if (!isEnabled()) {
    return;
  }
  const nr = (window as NewRelicWindow).newrelic;
  nr?.setCurrentRouteName(pathname);
}

export function noticePortalError(error: unknown, path: string, status?: number): void {
  if (!isEnabled()) {
    return;
  }
  const nr = (window as NewRelicWindow).newrelic;
  if (!nr) {
    return;
  }
  const err = error instanceof Error ? error : new Error(String(error));
  nr.noticeError(err, {
    path,
    status: status ?? 'network',
  });
}
