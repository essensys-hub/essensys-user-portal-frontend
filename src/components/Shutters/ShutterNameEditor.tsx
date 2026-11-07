import React, { useEffect, useState } from 'react';
import { SHUTTER_NAME_MAX_LENGTH, defaultName, validateShutterName } from '../../shutters/shutterNames';

export interface ShutterNameEditorProps {
  id: string;
  /** Nom actuellement affiché. */
  current: string;
  /** Vrai si un nom personnalisé est défini (active « Nom d'origine »). */
  customized: boolean;
  /** Enregistre le nom ; null = revenir au nom d'origine. */
  save: (name: string | null) => Promise<'saved' | 'dry_run'>;
}

type Notice = { kind: 'success' | 'info' | 'error'; text: string };

const noticeStyles: Record<Notice['kind'], string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  error: 'bg-red-50 border-red-200 text-red-700',
};

/**
 * Champ « Nom » de la fiche d'un volet (administrateur seulement). Le nom est affiché et saisi
 * comme texte brut ; la longueur est validée avant l'envoi. Aucun ordre n'est envoyé à l'armoire.
 */
export const ShutterNameEditor: React.FC<ShutterNameEditorProps> = ({ id, current, customized, save }) => {
  const [value, setValue] = useState(current);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const run = async (name: string | null) => {
    if (sending) return;
    setSending(true);
    setNotice(null);
    try {
      const mode = await save(name);
      const shown = name ?? defaultName(id);
      setNotice(
        mode === 'dry_run'
          ? { kind: 'info', text: `Nom « ${shown} » validé (test, non enregistré)` }
          : { kind: 'success', text: name === null ? `Nom d'origine rétabli : ${shown}` : `Nom enregistré : ${shown}` },
      );
    } catch (e) {
      console.error(e);
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : "Échec de l'enregistrement" });
    } finally {
      setSending(false);
    }
  };

  const submit = () => {
    const result = validateShutterName(value);
    if (!result.ok) {
      setFieldError(result.error);
      return;
    }
    setFieldError(null);
    void run(result.name);
  };

  return (
    <div className="space-y-3" data-testid={`shutter-name-${id}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div>
          {/* Le CSS hérité du portail fixe label et input : styles en ligne. */}
          <label
            htmlFor={`shutter-name-${id}-input`}
            className="block text-xs text-gray-600 mb-1"
            style={{ width: 'auto', marginRight: 0, textAlign: 'left' }}
          >
            Nom (1 à {SHUTTER_NAME_MAX_LENGTH} caractères)
          </label>
          <input
            id={`shutter-name-${id}-input`}
            type="text"
            value={value}
            disabled={sending}
            onChange={(e) => {
              setValue(e.target.value);
              setFieldError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            aria-invalid={fieldError !== null}
            style={{ width: '16rem', maxWidth: '100%' }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-essensys-primary focus:border-essensys-primary disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          disabled={sending}
          onClick={submit}
          className={`mt-5 px-3 py-1.5 text-sm font-medium rounded-lg bg-essensys-primary text-white ${
            sending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-essensys-primary-dark'
          }`}
        >
          Enregistrer
        </button>
        <button
          type="button"
          disabled={sending || !customized}
          onClick={() => void run(null)}
          className={`mt-5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-gray-100 text-gray-700 ${
            sending || !customized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'
          }`}
        >
          Nom d&apos;origine
        </button>
      </div>

      {fieldError && (
        <p role="alert" className="text-sm text-red-700">
          {fieldError}
        </p>
      )}

      {notice && (
        <div role="status" className={`p-3 rounded-lg border text-sm ${noticeStyles[notice.kind]}`}>
          {notice.text}
        </div>
      )}
    </div>
  );
};

export default ShutterNameEditor;
