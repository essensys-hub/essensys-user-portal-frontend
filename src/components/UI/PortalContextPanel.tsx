import React from 'react';
import { ServerStackIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { usePortalSession, formatUserDisplayName } from '../../context/PortalSessionContext';

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR');
};

export const PortalContextPanel: React.FC = () => {
  const { session, loading, error } = usePortalSession();

  if (loading && !session) {
    return (
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg animate-pulse h-28" />
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!session) return null;

  const displayName = formatUserDisplayName(session);
  const { user, gateway, armoire } = session;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-start gap-3">
          <UserCircleIcon className="w-8 h-8 text-essensys-primary flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Utilisateur</h2>
            <p className="text-base font-medium text-gray-800 truncate">{displayName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Rôle : {user.role}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-start gap-3">
          <ServerStackIcon className="w-8 h-8 text-essensys-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Armoire Essensys</h2>
              {armoire?.remote && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                  Pilotage distant
                </span>
              )}
            </div>
            {armoire ? (
              <>
                <p className="text-base font-medium text-gray-800">
                  N° série {armoire.no_serie}
                  <span className="text-sm font-normal text-gray-500"> · inv. #{armoire.id}</span>
                </p>
                <p className="text-sm text-gray-500">
                  IP {armoire.ip || '—'}
                  {armoire.geo_location ? ` · ${armoire.geo_location}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Dernière activité : {formatDate(armoire.last_seen)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Aucune armoire liée à ce compte.</p>
            )}
            {gateway && (
              <p className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${gateway.online ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                Gateway {gateway.hostname || gateway.id} {gateway.online ? 'en ligne' : 'hors ligne'}
                {gateway.ip ? ` · ${gateway.ip}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalContextPanel;
