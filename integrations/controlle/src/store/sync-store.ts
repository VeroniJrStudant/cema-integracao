import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { controlleConfig } from '../config.js';

export type SyncStoreEntry = {
  chave: string;
  idControlle?: string;
  status: 'ok' | 'erro';
  mensagem?: string;
  valorCentavos: number;
  dsTransaction?: string;
  dtSync: string;
};

type StoreFile = {
  updatedAt: string;
  entries: Record<string, SyncStoreEntry>;
};

function emptyStore(): StoreFile {
  return { updatedAt: new Date().toISOString(), entries: {} };
}

export function loadStore(): StoreFile {
  mkdirSync(controlleConfig.dataDir, { recursive: true });
  if (!existsSync(controlleConfig.storePath)) return emptyStore();
  try {
    return JSON.parse(readFileSync(controlleConfig.storePath, 'utf8')) as StoreFile;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: StoreFile): void {
  mkdirSync(controlleConfig.dataDir, { recursive: true });
  store.updatedAt = new Date().toISOString();
  writeFileSync(controlleConfig.storePath, JSON.stringify(store, null, 2), 'utf8');
}

export function hasOk(store: StoreFile, chave: string): boolean {
  return store.entries[chave]?.status === 'ok';
}

export function markOk(
  store: StoreFile,
  entry: Omit<SyncStoreEntry, 'status' | 'dtSync'> & { idControlle?: string },
): void {
  store.entries[entry.chave] = {
    ...entry,
    status: 'ok',
    dtSync: new Date().toISOString(),
  };
}

export function markErro(
  store: StoreFile,
  chave: string,
  valorCentavos: number,
  mensagem: string,
): void {
  store.entries[chave] = {
    chave,
    valorCentavos,
    status: 'erro',
    mensagem: mensagem.slice(0, 500),
    dtSync: new Date().toISOString(),
  };
}
