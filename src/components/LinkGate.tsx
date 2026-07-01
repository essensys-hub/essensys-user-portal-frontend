import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  fetchLinkStatus,
  getToken,
  submitLinkRequest,
  type LinkStatusResponse,
} from '../api/portalApi';
import { supportLoginUrl } from '../siteOrigins';

interface LinkGateProps {
  onAccessGranted?: () => void;
}

export const LinkGate = ({ onAccessGranted }: LinkGateProps) => {
  const [linkStatus, setLinkStatus] = useState<LinkStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [serial, setSerial] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = await fetchLinkStatus();
      setLinkStatus(status);
      if (status.portal_access) {
        onAccessGranted?.();
      }
    } catch {
      setLinkStatus(null);
      setError('Impossible de charger le statut — vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [onAccessGranted]);

  useEffect(() => {
    const syncAuth = () => setAuthed(Boolean(getToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    loadStatus();
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, [loadStatus]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!getToken()) {
      setError('Connectez-vous d\'abord sur le site Essensys.');
      return;
    }
    try {
      await submitLinkRequest(serial, message);
      await loadStatus();
    } catch {
      setError('Échec envoi de la demande — vérifiez que vous êtes connecté.');
    }
  };

  const box = 'bg-white rounded-lg shadow p-6 space-y-4';
  const request = linkStatus?.link_request;
  const gateway = linkStatus?.linked_gateway_id ?? null;
  const ineligibleGateway = gateway != null && gateway.replace(/^gw-/i, '') === 'essensys-server';

  if (loading && !linkStatus) {
    return <p className="text-gray-600">Chargement…</p>;
  }

  if (!authed) {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Connexion requise</h2>
        <p className="text-gray-600">
          Connectez-vous avec votre compte Essensys pour déposer une demande de liaison.
        </p>
        <a href={supportLoginUrl()} className="text-essensys-primary font-medium">
          Se connecter
        </a>
      </div>
    );
  }

  if (ineligibleGateway) {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Portail distant indisponible</h2>
        <p className="text-gray-600">
          Votre installation est rattachée au serveur legacy <strong>essensys-server</strong>.
          Le portail cloud mon.essensys.fr n&apos;est pas disponible pour ce type de gateway.
        </p>
        <p className="text-sm text-gray-500">
          Utilisez l&apos;interface locale de votre armoire ou contactez le support Essensys.
        </p>
      </div>
    );
  }

  if (request?.status === 'pending') {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Demande en attente</h2>
        <p className="text-gray-600">
          Un administrateur Essensys doit approuver la liaison de votre armoire.
        </p>
        <dl className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">N° série</dt>
            <dd className="font-medium">{request.machine_serial}</dd>
          </div>
          {request.message && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Message</dt>
              <dd className="text-right">{request.message}</dd>
            </div>
          )}
        </dl>
        <p className="text-sm text-gray-500">
          Dès validation, rechargez cette page pour accéder à la domotique.
        </p>
        <button
          type="button"
          onClick={loadStatus}
          className="text-essensys-primary font-medium text-sm"
        >
          Rafraîchir le statut
        </button>
      </div>
    );
  }

  if (request?.status === 'rejected') {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Demande refusée</h2>
        <p className="text-gray-600">Contactez le support Essensys pour plus d&apos;informations.</p>
      </div>
    );
  }

  if (request?.status === 'approved' && !linkStatus?.portal_access) {
    return (
      <div className={box}>
        <h2 className="text-xl font-semibold">Demande approuvée</h2>
        <p className="text-gray-600">
          Votre demande a été acceptée. Un administrateur finalise la liaison machine / gateway
          sur votre compte.
        </p>
        <button
          type="button"
          onClick={loadStatus}
          className="text-essensys-primary font-medium text-sm"
        >
          Rafraîchir le statut
        </button>
      </div>
    );
  }

  return (
    <div className={box}>
      <h2 className="text-xl font-semibold">Accès portail domotique</h2>
      <p className="text-gray-600">
        Demandez à un administrateur de lier votre armoire Essensys à votre compte.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">N° série machine</span>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Message (optionnel)</span>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-essensys-primary text-white px-4 py-2 rounded-lg">
          Envoyer la demande
        </button>
      </form>
    </div>
  );
};
