import type { DryRunResponse } from '../testMode';

export type LiveResponse = DryRunResponse & { guid?: string; guids?: string[] };

export function assertDryRunOnly(data: LiveResponse): void {
  if (data.guid || (data.guids && data.guids.length > 0)) {
    throw new Error(
      'RÉPONSE LIVE (guid présent) — la commande a probablement été envoyée à l\'armoire. Arrêt immédiat.',
    );
  }
  if (!data.dry_run) {
    throw new Error(
      `dry_run absent — backend portail non à jour ou mode test ignoré (status=${data.status ?? '?'})`,
    );
  }
  if (data.status !== 'test_ok') {
    throw new Error(data.message ?? `statut inattendu : ${data.status}`);
  }
}
