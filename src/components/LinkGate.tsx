import { type FormEvent, useEffect, useState } from 'react';
import { fetchLinkStatus, getToken, submitLinkRequest } from '../api/portalApi';

export const LinkGate = () => {
  const [status, setStatus] = useState<string>('loading');
  const [serial, setSerial] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const syncAuth = () => setAuthed(Boolean(getToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    fetchLinkStatus()
      .then((s) => setStatus(s.link_request?.status ?? 'none'))
      .catch(() => setStatus('error'));
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!getToken()) {
      setError('Connectez-vous d\'abord sur le site Essensys.');
      return;
    }
    try {
      await submitLinkRequest(serial, message);
      setStatus('pending');
    } catch {
      setError('Échec envoi de la demande — vérifiez que vous êtes connecté.');
    }
  };

  const box = 'bg-white rounded-lg shadow p-6 space-y-4';

  if (status === 'loading') {
    return <p className="text-gray-600">Chargement…</p>;
  }

  if (!authed) {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Connexion requise</h2>
        <p className="text-gray-600">Connectez-vous avec votre compte Essensys pour déposer une demande de liaison.</p>
        <a href="/login?return=/portal/" className="text-essensys-primary font-medium">Se connecter</a>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Demande en attente</h2>
        <p className="text-gray-600">Un administrateur Essensys doit approuver la liaison de votre armoire.</p>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Demande refusée</h2>
        <p className="text-gray-600">Contactez le support Essensys pour plus d&apos;informations.</p>
      </div>
    );
  }

  return (
    <div className={box}>
      <h2 className="text-xl font-semibold">Accès portail domotique</h2>
      <p className="text-gray-600">Demandez à un administrateur de lier votre armoire Essensys à votre compte.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">N° série machine</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2" value={serial} onChange={(e) => setSerial(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Message (optionnel)</span>
          <textarea className="mt-1 w-full border rounded-lg px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-essensys-primary text-white px-4 py-2 rounded-lg">Envoyer la demande</button>
      </form>
    </div>
  );
};
