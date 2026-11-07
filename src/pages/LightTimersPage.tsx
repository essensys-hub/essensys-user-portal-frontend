import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { LightTimerControl } from '../components/Lighting/LightTimerControl';
import { usePortalSession } from '../context/PortalSessionContext';
import { useTestMode } from '../context/TestModeContext';
import { isArmoireOnline } from '../api/portalApi';
import { LIGHT_TIMER_CATALOG, isLightTimerAdmin } from '../lights/lightTimers';
import { useLightTimers } from '../lights/useLightTimers';
import { useLightNames } from '../lights/useLightNames';

export const LightTimersPage: React.FC = () => {
  const { session } = usePortalSession();
  const { enabled: testMode } = useTestMode();
  const admin = isLightTimerAdmin(session?.user?.role);
  const online = isArmoireOnline(session);
  const { timers, error, readValue, writeValue } = useLightTimers(admin);
  const { displayName } = useLightNames();

  return (
    <div>
      <PageHeader
        title="Temporisations"
        description="Durée avant extinction automatique de certaines lumières"
        icon={ClockIcon}
        backLink="/lighting"
        backLabel="Éclairage"
      />

      {!admin ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          Ce réglage est réservé à l&apos;administrateur de l&apos;armoire.
        </div>
      ) : (
        <div className="space-y-6">
          {testMode && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900">
              Mode test actif — les réglages sont validés mais non envoyés à l&apos;armoire.
            </div>
          )}
          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <ul className="space-y-6" data-testid="light-timers-list">
            {LIGHT_TIMER_CATALOG.map((entry) => {
              const timer = timers?.find((t) => t.id === entry.id);
              return (
                <li key={entry.id} data-testid={`light-timers-row-${entry.id}`}>
                  <ControlCard
                    title={displayName(entry.id)}
                    description={timers ? "Durée avant extinction automatique" : 'Lecture…'}
                  >
                    {timers && (
                      <LightTimerControl
                        id={entry.id}
                        label={displayName(entry.id)}
                        value={timer?.minutes ?? null}
                        online={online}
                        dryRun={testMode}
                        readValue={() => readValue(entry.id)}
                        writeValue={(m) => writeValue(entry.id, m)}
                      />
                    )}
                  </ControlCard>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LightTimersPage;
