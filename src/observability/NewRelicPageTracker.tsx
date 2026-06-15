import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../observability/newrelic';

/** Envoie une page view New Relic à chaque changement de route SPA. */
export function NewRelicPageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
