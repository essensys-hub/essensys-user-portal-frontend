import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchPortalSession, type PortalSessionResponse } from '../api/portalApi';

interface PortalSessionContextValue {
  session: PortalSessionResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const PortalSessionContext = createContext<PortalSessionContextValue | null>(null);

export const PortalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<PortalSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortalSession();
      setSession(data);
    } catch {
      setError('Impossible de charger la session portail');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const t = setInterval(refetch, 60000);
    return () => clearInterval(t);
  }, [refetch]);

  return (
    <PortalSessionContext.Provider value={{ session, loading, error, refetch }}>
      {children}
    </PortalSessionContext.Provider>
  );
};

export const usePortalSession = (): PortalSessionContextValue => {
  const ctx = useContext(PortalSessionContext);
  if (!ctx) {
    throw new Error('usePortalSession must be used within PortalSessionProvider');
  }
  return ctx;
};

export const formatUserDisplayName = (session: PortalSessionResponse | null): string => {
  if (!session?.user) return 'Utilisateur';
  const { first_name, last_name, email } = session.user;
  const name = [first_name, last_name].filter(Boolean).join(' ').trim();
  return name || email;
};
