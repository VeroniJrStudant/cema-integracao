import { controlleConfig } from '../config.js';

export class ControlleHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = 'ControlleHttpError';
  }
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${controlleConfig.apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${controlleConfig.token}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new ControlleHttpError(
      `Controlle ${method} ${path} → HTTP ${res.status}`,
      res.status,
      text.slice(0, 2000),
    );
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function asArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const key of [
      'data',
      'items',
      'results',
      'content',
      'planAccountsEntities',
      'costCenters',
      'accounts',
    ]) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return [];
}

export type ControlleEntity = Record<string, unknown>;

export async function listCategorias(params?: {
  description?: string;
  movement?: number;
}): Promise<ControlleEntity[]> {
  const q = new URLSearchParams();
  if (params?.description) q.set('description', params.description);
  if (params?.movement != null) q.set('movement', String(params.movement));
  const qs = q.toString();
  const data = await request<unknown>(
    'GET',
    `/plan-account/v1/planAccountsEntities${qs ? `?${qs}` : ''}`,
  );
  return asArray(data) as ControlleEntity[];
}

export async function listCentrosCusto(ds?: string): Promise<ControlleEntity[]> {
  const qs = ds ? `?ds_cost_center=${encodeURIComponent(ds)}` : '';
  const candidates = [
    `/cost-center/v1/costCenters/${qs}`.replace('/?', '?'),
    `/cost-center/v1/costCenters${qs}`,
  ];
  for (const p of candidates) {
    try {
      const data = await request<unknown>('GET', p);
      const arr = asArray(data) as ControlleEntity[];
      if (arr.length) return arr;
    } catch {
      // tenta próximo path
    }
  }
  return [];
}

export async function listContas(params?: {
  ds_account?: string;
  status?: number;
}): Promise<ControlleEntity[]> {
  const q = new URLSearchParams();
  if (params?.ds_account) q.set('ds_account', params.ds_account);
  if (params?.status != null) q.set('status', String(params.status));
  const qs = q.toString();
  const data = await request<unknown>('GET', `/account/v1/accounts${qs ? `?${qs}` : ''}`);
  return asArray(data) as ControlleEntity[];
}

export type EntradaUnicaPayload = {
  ds_transaction: string;
  dt_competence: string;
  activity_type: 1;
  repeat_type: 1;
  type: 0;
  id_accounts_main: number;
  obs_transaction?: string;
  itens: Array<{
    id_plan_accounts_entities: number;
    id_cost_centers: number;
    value_in_cent: number;
  }>;
  payments: Array<{
    situation: 0 | 1;
    value_in_cent: number;
    dt_due: string;
    id_accounts_paid?: number;
    payment_in_cent?: number;
    dt_billing?: string;
  }>;
};

export async function criarEntradaUnica(payload: EntradaUnicaPayload): Promise<unknown> {
  return request('POST', '/transaction/v1/transactions/', payload);
}

export function pickId(entity: ControlleEntity): number | undefined {
  for (const key of [
    'id',
    'id_plan_accounts_entities',
    'id_cost_centers',
    'id_accounts',
    'id_accounts_main',
  ]) {
    const v = entity[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  }
  return undefined;
}

export function pickText(entity: ControlleEntity): string {
  for (const key of [
    'ds_plan_account',
    'description',
    'ds_description',
    'ds_cost_center',
    'ds_account',
    'name',
    'code',
    'cd_plan_account',
  ]) {
    const v = entity[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return JSON.stringify(entity).slice(0, 120);
}

export function entityMatchesCode(entity: ControlleEntity, code: string): boolean {
  const needle = code.toLowerCase().replace(/\s/g, '');
  const blob = JSON.stringify(entity).toLowerCase().replace(/\s/g, '');
  return blob.includes(needle);
}
