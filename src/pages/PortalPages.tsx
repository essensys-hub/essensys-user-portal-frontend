import { useEffect, useState } from 'react';
import { fetchGatewayOnline, injectOrder } from '../api/portalApi';

interface ShutterControlProps {
  label: string;
  openIndex: number;
  closeIndex: number;
  openValue: string;
  closeValue: string;
}

const ShutterControl = ({ label, openIndex, closeIndex, openValue, closeValue }: ShutterControlProps) => {
  const [busy, setBusy] = useState(false);
  const send = async (k: number, v: string) => {
    setBusy(true);
    try {
      await injectOrder(k, v);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="control">
      <span>{label}</span>
      <button type="button" disabled={busy} onClick={() => send(openIndex, openValue)}>Ouvrir</button>
      <button type="button" disabled={busy} onClick={() => send(closeIndex, closeValue)}>Fermer</button>
    </div>
  );
};

export const VoletsPage = () => (
  <section>
    <h1>Volets</h1>
    <ShutterControl label="Volet cuisine 1" openIndex={619} closeIndex={622} openValue="1" closeValue="1" />
    <ShutterControl label="Volet salon" openIndex={617} closeIndex={620} openValue="1" closeValue="1" />
  </section>
);

export const EclairagePage = () => {
  const sendLight = async (k: number, v: string) => injectOrder(k, v);
  return (
    <section>
      <h1>Éclairage</h1>
      <div className="control">
        <span>Entrée</span>
        <button type="button" onClick={() => sendLight(616, '4')}>On</button>
        <button type="button" onClick={() => sendLight(610, '4')}>Off</button>
      </div>
    </section>
  );
};

export const DashboardPage = () => {
  const [online, setOnline] = useState(false);
  useEffect(() => {
    fetchGatewayOnline().then(setOnline);
    const t = setInterval(() => fetchGatewayOnline().then(setOnline), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <section>
      <h1>Dashboard</h1>
      <p className={online ? 'badge online' : 'badge offline'}>
        Gateway {online ? 'en ligne' : 'hors ligne'}
      </p>
      <p>Utilisez le menu pour piloter volets et éclairage.</p>
    </section>
  );
};
