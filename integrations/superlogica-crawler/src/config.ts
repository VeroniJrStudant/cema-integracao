import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const crawlerRoot = path.resolve(__dirname, '..');
const envPath = path.join(crawlerRoot, '.env');

// Usa SOMENTE o .env da pasta do crawler
if (!fs.existsSync(envPath)) {
  throw new Error(
    `Arquivo .env não encontrado em ${envPath}. Copie .env.example e preencha.`,
  );
}
const loaded = dotenv.config({ path: envPath });
if (loaded.error) {
  throw loaded.error;
}
console.log(`[config] .env carregado: ${envPath}`);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  baseUrl: optional(
    'SUPERLOGICA_BASE_URL',
    'https://apps.superlogica.net/imobiliaria',
  ).replace(/\/$/, ''),
  user: () => required('SUPERLOGICA_USER'),
  password: () => required('SUPERLOGICA_PASSWORD'),
  /** Opcional: abre direto nesta URL (ex.: MFA challenge). Senão usa BASE_URL. */
  startUrl: optional('SUPERLOGICA_START_URL', ''),
  headed: optional('PLAYWRIGHT_HEADED', 'false').toLowerCase() === 'true',
  authDir: path.join(crawlerRoot, '.auth'),
  storageStatePath: path.join(crawlerRoot, '.auth', 'storage-state.json'),
  outputDir: path.join(crawlerRoot, 'output'),
  imap: {
    host: optional('IMAP_HOST', 'imap.gmail.com'),
    port: Number(optional('IMAP_PORT', '993')),
    user: () => required('IMAP_USER'),
    password: () => required('IMAP_PASSWORD'),
    fromFilter: optional('IMAP_FROM_FILTER', 'superlogica'),
    subjectFilter: optional('IMAP_SUBJECT_FILTER', ''),
  },
  otp: {
    regex: new RegExp(optional('OTP_REGEX', '(\\d{4,8})')),
    /** Tempo total de espera do OTP (padrão 90s — menos loops no Gmail). */
    timeoutMs: Number(optional('OTP_TIMEOUT_SEC', '90')) * 1000,
    /** Intervalo entre reloads da busca no Gmail (padrão 10s). */
    pollIntervalMs: Number(optional('OTP_POLL_SEC', '10')) * 1000,
    via: optional('OTP_VIA', 'gmail-browser'), // gmail-browser | imap
  },
  gmail: {
    url: optional(
      'GMAIL_URL',
      'https://mail.google.com/mail/u/0/?ogbl#inbox',
    ),
    user: () => optional('GMAIL_USER') || required('SUPERLOGICA_USER'),
    password: () => optional('GMAIL_PASSWORD') || required('SUPERLOGICA_PASSWORD'),
  },
  drive: {
    folderId: optional('DRIVE_FOLDER_ID', ''),
    serviceAccountPath: optional(
      'GOOGLE_APPLICATION_CREDENTIALS',
      path.join(crawlerRoot, '.auth', 'google-sa.json'),
    ),
    uploadEnabled: optional('DRIVE_UPLOAD', 'true').toLowerCase() !== 'false',
  },
};
