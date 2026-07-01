/** Site support (inscription, login, admin). */
export const SUPPORT_SITE_ORIGIN =
  import.meta.env.VITE_SUPPORT_SITE_ORIGIN || 'https://www.essensys.fr';

/** React Router basename — aligné sur vite base (`/` ou `/portal`). */
export const portalRouterBasename = (): string | undefined => {
  if (
    import.meta.env.VITE_PORTAL_ROOT === 'true' ||
    import.meta.env.VITE_DEMO_ROOT === 'true'
  ) {
    return undefined;
  }
  return '/portal';
};

export const supportLoginUrl = (returnTo: string = window.location.origin): string => {
  const base = import.meta.env.DEV ? '' : SUPPORT_SITE_ORIGIN;
  const path = `/login?return=${encodeURIComponent(returnTo)}`;
  return base ? `${base}${path}` : path;
};
