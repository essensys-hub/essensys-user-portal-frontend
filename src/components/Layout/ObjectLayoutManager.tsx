import React, { useState } from 'react';
import { effectiveLayout, moveInGroup, type LayoutKind, type ObjectLayout } from '../../layout/objectLayout';

export interface ObjectLayoutManagerProps {
  kind: LayoutKind;
  /** Identifiants du catalogue, dans l'ordre d'origine. */
  ids: readonly string[];
  groupOf: (id: string) => string;
  /** Nom affiché (nom personnalisé sinon nom d'origine), rendu comme texte brut. */
  displayName: (id: string) => string;
  layout: ObjectLayout;
  save: (body: { order: string[]; disabled: string[] } | { reset: true }) => Promise<'saved' | 'dry_run'>;
  onClose: () => void;
}

type Notice = { kind: 'success' | 'info' | 'error'; text: string };

const noticeStyles: Record<Notice['kind'], string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  error: 'bg-red-50 border-red-200 text-red-700',
};

/**
 * Écran de gestion (administrateur de l'armoire seulement) : tous les objets du genre, désactivés
 * compris. Les modifications restent locales jusqu'à « Enregistrer » (une seule écriture).
 * Pas de balises `section`, `header` ni `label` : index.css leur applique des styles historiques (980 px).
 */
export const ObjectLayoutManager: React.FC<ObjectLayoutManagerProps> = ({
  kind,
  ids,
  groupOf,
  displayName,
  layout,
  save,
  onClose,
}) => {
  const initial = effectiveLayout(ids, layout);
  const [ordered, setOrdered] = useState<string[]>(initial.ordered);
  const [disabled, setDisabled] = useState<Set<string>>(new Set(initial.disabled));
  const [resetPending, setResetPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const word = kind === 'lights' ? 'lumières' : 'volets et stores';

  const toggle = (id: string) => {
    setResetPending(false);
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const move = (id: string, direction: -1 | 1) => {
    const next = moveInGroup(ordered, groupOf, id, direction);
    if (!next) return;
    setResetPending(false);
    setOrdered(next);
  };

  const originalOrder = () => {
    setOrdered([...ids]);
    setDisabled(new Set());
    setResetPending(true);
    setNotice(null);
  };

  const run = async () => {
    if (sending) return;
    setSending(true);
    setNotice(null);
    try {
      const mode = await save(resetPending ? { reset: true } : { order: ordered, disabled: ids.filter((i) => disabled.has(i)) });
      setResetPending(false);
      setNotice(
        mode === 'dry_run'
          ? { kind: 'info', text: 'Disposition validée (test, non enregistrée)' }
          : { kind: 'success', text: 'Disposition enregistrée' },
      );
    } catch (e) {
      console.error(e);
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : "Échec de l'enregistrement" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="group"
      data-testid={`layout-manager-${kind}`}
      aria-label={`Gérer l'affichage des ${word}`}
      className="mb-6 p-4 bg-white border border-gray-200 rounded-lg space-y-4"
    >
      <p className="text-xs text-gray-500">
        Désactivez un objet pour le masquer partout (listes, commandes de groupe
        {kind === 'lights' ? ', Temporisations' : ', Temps de course'}). Les scénarios gardent la liste complète.
      </p>
      <ul className="space-y-2">
        {ordered.map((id, i) => {
          const group = groupOf(id);
          const isOff = disabled.has(id);
          const first = i === 0 || groupOf(ordered[i - 1]) !== group;
          const last = i === ordered.length - 1 || groupOf(ordered[i + 1]) !== group;
          return (
            <li
              key={id}
              data-testid={`layout-row-${id}`}
              className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg"
            >
              <span
                data-testid={`layout-name-${id}`}
                className={`min-w-0 grow basis-48 [overflow-wrap:anywhere] text-sm font-medium ${isOff ? 'text-gray-400 line-through' : 'text-gray-700'}`}
              >
                {displayName(id)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    role="switch"
                    data-testid={`layout-switch-${id}`}
                    aria-label={`${displayName(id)} : ${isOff ? 'désactivé' : 'activé'}`}
                    checked={!isOff}
                    onChange={() => toggle(id)}
                  />
                  <span aria-hidden="true">{isOff ? 'Désactivé' : 'Activé'}</span>
                </div>
                <button
                  type="button"
                  data-testid={`layout-up-${id}`}
                  aria-label={`Monter ${displayName(id)}`}
                  disabled={first}
                  onClick={() => move(id, -1)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40"
                >
                  Monter
                </button>
                <button
                  type="button"
                  data-testid={`layout-down-${id}`}
                  aria-label={`Descendre ${displayName(id)}`}
                  disabled={last}
                  onClick={() => move(id, 1)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40"
                >
                  Descendre
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={run}
          disabled={sending}
          className="px-3 py-1.5 text-sm font-medium text-white bg-essensys-primary rounded-lg disabled:opacity-50"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={originalOrder}
          disabled={sending}
          className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg"
        >
          Ordre d&apos;origine
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-essensys-primary hover:underline">
          Fermer
        </button>
      </div>
      {notice && (
        <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`p-2 text-sm border rounded-lg ${noticeStyles[notice.kind]}`}>
          {notice.text}
        </p>
      )}
    </div>
  );
};
