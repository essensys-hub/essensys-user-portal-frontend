import { FormEvent, useEffect, useState } from 'react';
import { fetchLinkStatus, submitLinkRequest } from '../api/portalApi';

export const LinkGate = () => {
  const [status, setStatus] = useState<string>('loading');
  const [serial, setSerial] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinkStatus()
      .then((s) => setStatus(s.link_request?.status ?? 'none'))
      .catch(() => setStatus('error'));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await submitLinkRequest(serial, message);
      setStatus('pending');
    } catch {
      setError('Échec envoi de la demande');
    }
  };

  if (status === 'loading') {
    return <p>Chargement…</p>;
  }
  if (status === 'pending') {
    return (
      <div className="gate">
        <h2>Demande en attente</h2>
        <p>Un administrateur Essensys doit approuver la liaison de votre armoire.</p>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="gate">
        <h2>Demande refusée</h2>
        <p>Contactez le support Essensys pour plus d&apos;informations.</p>
      </div>
    );
  }

  return (
    <div className="gate">
      <h2>Accès portail domotique</h2>
      <p>Demandez à un administrateur de lier votre armoire Essensys à votre compte.</p>
      <form onSubmit={onSubmit}>
        <label>
          N° série machine
          <input value={serial} onChange={(e) => setSerial(e.target.value)} required />
        </label>
        <label>
          Message (optionnel)
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Envoyer la demande</button>
      </form>
    </div>
  );
};
