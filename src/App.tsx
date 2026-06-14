import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { fetchLinkStatus } from './api/portalApi';
import { LinkGate } from './components/LinkGate';
import { DashboardPage, EclairagePage, VoletsPage } from './pages/PortalPages';
import './styles.css';

const PortalShell = ({ children }: { children: React.ReactNode }) => (
  <div className="layout">
    <header>
      <strong>Essensys Portail</strong>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/volets">Volets</Link>
        <Link to="/eclairage">Éclairage</Link>
      </nav>
    </header>
    <main>{children}</main>
  </div>
);

const App = () => {
  const [access, setAccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetchLinkStatus()
      .then((s) => setAccess(s.portal_access))
      .catch(() => setAccess(false));
  }, []);

  if (access === null) {
    return <p className="center">Chargement portail…</p>;
  }

  if (!access) {
    return (
      <div className="layout">
        <header><strong>Essensys Portail</strong></header>
        <main><LinkGate /></main>
      </div>
    );
  }

  return (
    <PortalShell>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/volets" element={<VoletsPage />} />
        <Route path="/eclairage" element={<EclairagePage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </PortalShell>
  );
};

export default App;
