import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts';
import { LinkGate } from './components/LinkGate';
import { captureTokenFromURL, fetchLinkStatus } from './api/portalApi';
import {
  DashboardPage,
  SecurityPage,
  HeatingPage,
  LightingPage,
  ShuttersPage,
  WaterHeaterPage,
  SprinklerPage,
  NotificationsPage,
  SettingsPage,
} from './pages';

captureTokenFromURL();

function PortalRoutes() {
  return (
    <DashboardProvider>
      <ThemeProvider>
        <BrowserRouter basename="/portal">
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/heating" element={<HeatingPage />} />
              <Route path="/lighting" element={<LightingPage />} />
              <Route path="/shutters" element={<ShuttersPage />} />
              <Route path="/water-heater" element={<WaterHeaterPage />} />
              <Route path="/sprinkler" element={<SprinklerPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </DashboardProvider>
  );
}

function App() {
  const [access, setAccess] = useState<boolean | null>(null);

  const refreshAccess = useCallback(() => {
    fetchLinkStatus()
      .then((s) => setAccess(s.portal_access))
      .catch(() => setAccess(false));
  }, []);

  useEffect(() => {
    refreshAccess();
  }, []);

  if (access === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement portail…
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-essensys-primary text-white px-6 py-4">
          <strong>Essensys Portail</strong>
        </header>
        <main className="max-w-lg mx-auto p-6">
          <LinkGate onAccessGranted={refreshAccess} />
        </main>
      </div>
    );
  }

  return <PortalRoutes />;
}

export default App;
