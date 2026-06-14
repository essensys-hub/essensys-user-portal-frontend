import { FormEvent, useEffect, useState } from 'react';
import { fetchLinkStatus, getToken, submitLinkRequest } from '../api/portalApi';

export const LinkGate = () => {
  const [status, setStatus] = useState<string>('loading');
  const [serial, setSerial] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getToken()));
    fetchLinkStatus()
      .then((s) => setStatus(s.link_request?.status ?? 'none'))
      .catch(() => setStatus('error'));
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

  if (status === 'loading') {
    return <p>Chargement…</p>;
  }

  if (!authed) {
    return (
      <div className="gate">
        <h2>Connexion requise</h2>
        <p>Connectez-vous avec votre compte Essensys pour déposer une demande de liaison.</p>
        <p><a href="/login">Se connecter</a></p>
      </div>
    );
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
