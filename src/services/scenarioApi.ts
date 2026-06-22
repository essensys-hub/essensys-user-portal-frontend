import { portalFetch } from '../api/portalApi';

export interface ScenarioSlotSummary {
  slot_number: number;
  label: string;
  base_index: number;
  end_index: number;
  editable: boolean;
  last_launched?: number;
}

export interface ExchangeKV {
  k: number;
  v: string;
}

export interface ScenarioSlotDetail extends ScenarioSlotSummary {
  params: ExchangeKV[];
}

export interface BitmaskBit {
  bit: number;
  value: number;
  label: string;
}

export interface BitmaskField {
  index: number;
  name: string;
  description?: string;
  bits: BitmaskBit[];
}

const prefix = '/scenarios';

export const fetchScenarios = async (): Promise<ScenarioSlotSummary[]> => {
  const res = await portalFetch(prefix);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.slots ?? [];
};

export const fetchScenario = async (slot: number): Promise<ScenarioSlotDetail> => {
  const res = await portalFetch(`${prefix}/${slot}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const launchScenario = async (slot: number): Promise<string> => {
  const res = await portalFetch(`${prefix}/${slot}/launch`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (data.dry_run && data.status === 'test_ok') {
    return `test-ok-${slot}`;
  }
  return data.guid as string;
};

export const updateScenario = async (
  slot: number,
  params: Record<number, string>,
): Promise<string[]> => {
  const res = await portalFetch(`${prefix}/${slot}`, {
    method: 'PUT',
    body: JSON.stringify({ params }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return (data.guids as string[]) ?? [];
};

export const restoreScenario = async (slot: number): Promise<string> => {
  const res = await portalFetch(`${prefix}/${slot}/restore`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.guid as string;
};

export const fetchScenarioBitmasks = async (): Promise<BitmaskField[]> => {
  const res = await portalFetch(`${prefix}/meta/bitmasks`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.fields ?? [];
};
