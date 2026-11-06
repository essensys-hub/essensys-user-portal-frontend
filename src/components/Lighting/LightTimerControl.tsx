import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LIGHT_TIMER_SHORTCUTS,
  formatMinutes,
  validateCustomMinutes,
  type LightTimerMinutes,
} from '../../lights/lightTimers';

export interface LightTimerControlProps {
  id: string;
  label: string;
  /** Valeur lue par le parent (null = jamais lue). */
  value: LightTimerMinutes;
  /** Armoire joignable : sinon les contrôles sont désactivés. */
  online: boolean;
  /** Mode test : la commande est validée sans être exécutée. */
  dryRun: boolean;
  /** Relit la valeur courante de cette lumière. */
  readValue: () => Promise<LightTimerMinutes>;
  /** Envoie la nouvelle durée (0 = jamais). */
  writeValue: (minutes: number) => Promise<'queued' | 'dry_run'>;
}

/** Relectures de la valeur après un envoi (l'armoire exécute en ~5 s). */
const RECHECK_DELAYS_MS = [5000, 10000, 20000];

type Notice = { kind: 'success' | 'info' | 'error'; text: string };

const noticeStyles: Record<Notice['kind'], string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  error: 'bg-red-50 border-red-200 text-red-700',
};

/**
 * Réglage de la temporisation d'une lumière : raccourcis 15 min, 30 min, 1 h, Jamais et valeur
 * libre de 1 à 255 minutes. Réutilisé par la page « Temporisations » et le panneau de chaque
 * lumière concernée.
 */
export const LightTimerControl: React.FC<LightTimerControlProps> = ({
  id,
  label,
  value,
  online,
  dryRun,
  readValue,
  writeValue,
}) => {
  const [current, setCurrent] = useState<LightTimerMinutes>(value);
  const [sending, setSending] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [custom, setCustom] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setCurrent(value);
  }, [value]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const waitFor = (expected: number) => {
    clearTimers();
    setWaiting(true);
    RECHECK_DELAYS_MS.forEach((delay, i) => {
      const t = window.setTimeout(async () => {
        const got = await readValue().catch(() => null);
        if (got !== null) setCurrent(got);
        const last = i === RECHECK_DELAYS_MS.length - 1;
        if (got === expected) {
          setWaiting(false);
          setNotice({ kind: 'success', text: `${label} : ${formatMinutes(got)} confirmée par l'armoire` });
          clearTimers();
        } else if (last) {
          setWaiting(false);
          setNotice({
            kind: 'error',
            text: `${label} : l'armoire n'a pas encore confirmé (valeur lue : ${formatMinutes(got)})`,
          });
        }
      }, delay);
      timers.current.push(t);
    });
  };

  const send = async (minutes: number) => {
    if (sending) return;
    setSending(true);
    setNotice(null);
    setCustomError(null);
    try {
      const mode = await writeValue(minutes);
      if (mode === 'dry_run' || dryRun) {
        setNotice({ kind: 'info', text: `${label} : ${formatMinutes(minutes)} validée (test, non exécutée)` });
      } else {
        setNotice({
          kind: 'success',
          text: `${label} : ${formatMinutes(minutes)} envoyée — l'armoire applique sous ~5 s`,
        });
        waitFor(minutes);
      }
    } catch (e) {
      console.error(e);
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : `${label} : échec de l'envoi` });
    } finally {
      setSending(false);
    }
  };

  const applyCustom = () => {
    const result = validateCustomMinutes(custom);
    if (!result.ok) {
      setCustomError(result.error);
      return;
    }
    setCustom('');
    void send(result.minutes);
  };

  const disabled = !online || sending;

  return (
    <div className="space-y-3" data-testid={`light-timer-${id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Extinction automatique :</span>
        <span
          data-testid={`light-timer-${id}-value`}
          className={`inline-block text-sm px-3 py-1 rounded-full ${
            waiting ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {formatMinutes(current)}
        </span>
        {waiting && <span className="text-xs text-amber-800">En attente de l&apos;armoire</span>}
      </div>

      {!online && <p className="text-sm text-gray-600">Armoire hors ligne : le réglage est indisponible.</p>}

      <div className="flex flex-wrap gap-2" role="group" aria-label={`Durée pour ${label}`}>
        {LIGHT_TIMER_SHORTCUTS.map((s) => (
          <button
            key={s.minutes}
            type="button"
            disabled={disabled}
            aria-pressed={current === s.minutes}
            onClick={() => void send(s.minutes)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              current === s.minutes
                ? 'bg-essensys-primary text-white border-essensys-primary'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <div>
          {/* Le CSS hérité du portail fixe label (220 px, à droite) et input (290 px) : styles en ligne. */}
          <label
            htmlFor={`light-timer-${id}-custom`}
            className="block text-xs text-gray-600 mb-1"
            style={{ width: 'auto', marginRight: 0, textAlign: 'left' }}
          >
            Autre durée (minutes, 1 à 255)
          </label>
          <input
            id={`light-timer-${id}-custom`}
            type="text"
            inputMode="numeric"
            value={custom}
            disabled={disabled}
            onChange={(e) => {
              setCustom(e.target.value);
              setCustomError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyCustom();
            }}
            aria-invalid={customError !== null}
            style={{ width: '7rem' }}
            className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-essensys-primary focus:border-essensys-primary disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={applyCustom}
          className={`mt-5 px-3 py-1.5 text-sm font-medium rounded-lg bg-essensys-primary text-white ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-essensys-primary-dark'
          }`}
        >
          Appliquer
        </button>
      </div>

      {customError && (
        <p role="alert" className="text-sm text-red-700">
          {customError}
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

export default LightTimerControl;
