import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const envPath = path.join(root, '.env');
if (existsSync(envPath)) loadDotenv({ path: envPath });
else loadDotenv();

function req(name: string): string {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Falta ${name} no .env (integrations/controlle/.env)`);
  return v;
}

function opt(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

function optInt(name: string): number | undefined {
  const raw = opt(name);
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${name} inválido: ${raw}`);
  return n;
}

export const controlleConfig = {
  rootDir: root,
  dataDir: path.join(root, '.data'),
  storePath: path.join(root, '.data', 'sync-store.json'),
  apiBase: opt('CONTROLLE_API_BASE', 'https://api-v1.controlle.com').replace(/\/$/, ''),
  get token(): string {
    return req('CONTROLLE_API_TOKEN');
  },
  get idCategoria3112(): number {
    const n = optInt('CONTROLLE_ID_CATEGORIA_3112');
    if (n == null) throw new Error('Falta CONTROLLE_ID_CATEGORIA_3112 — rode npm run resolve-ids');
    return n;
  },
  get idCentroIntermediacao(): number {
    const n = optInt('CONTROLLE_ID_CENTRO_INTERMEDIACAO');
    if (n == null) throw new Error('Falta CONTROLLE_ID_CENTRO_INTERMEDIACAO — rode npm run resolve-ids');
    return n;
  },
  get idContaPadrao(): number {
    const n = optInt('CONTROLLE_ID_CONTA_PADRAO');
    if (n == null) throw new Error('Falta CONTROLLE_ID_CONTA_PADRAO — rode npm run resolve-ids');
    return n;
  },
  tryIds(): {
    categoria?: number;
    centro?: number;
    conta?: number;
  } {
    return {
      categoria: optInt('CONTROLLE_ID_CATEGORIA_3112'),
      centro: optInt('CONTROLLE_ID_CENTRO_INTERMEDIACAO'),
      conta: optInt('CONTROLLE_ID_CONTA_PADRAO'),
    };
  },
};

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}
