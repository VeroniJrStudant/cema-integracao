import fs from 'node:fs';
import path from 'node:path';
import { GoogleAuth, type JWTInput } from 'google-auth-library';
import { config } from '../config.js';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';

/**
 * Envia o CSV para a pasta 196a-automacao-superlogica-controller.
 * Sem DRIVE_FOLDER_ID: não envia (modo semi-manual).
 */
export async function uploadCsvToDrive(localPath: string): Promise<string | null> {
  if (!config.drive.uploadEnabled) {
    console.log('[drive] DRIVE_UPLOAD=false — pulando envio');
    return null;
  }
  if (!config.drive.folderId) {
    console.log(
      '[drive] DRIVE_FOLDER_ID vazio — CSV só local. Coloque o arquivo na pasta Drive à mão.',
    );
    return null;
  }
  if (!fs.existsSync(localPath)) {
    throw new Error(`CSV não encontrado: ${localPath}`);
  }

  const auth = buildGoogleAuth();
  const client = await auth.getClient();
  const access = await client.getAccessToken();
  const token = typeof access === 'string' ? access : access?.token;
  if (!token) {
    throw new Error('Não foi possível obter token da service account do Google.');
  }

  const fileName = path.basename(localPath);
  const media = fs.readFileSync(localPath);
  const metadata = {
    name: fileName,
    parents: [config.drive.folderId],
    mimeType: 'text/csv',
  };

  const boundary = 'cema196a';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: text/csv\r\n\r\n`),
    media,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    if (
      res.status === 403 &&
      /Service Accounts do not have storage quota|storageQuotaExceeded/i.test(text)
    ) {
      throw new Error(
        'Upload bloqueado: service account não tem cota no "Meu Drive".\n' +
          'Solução: mova a pasta 196a-automacao-superlogica-controller para uma\n' +
          'Unidade compartilhada (Shared Drive), adicione a service account como\n' +
          'Gerenciador de conteúdo, e atualize DRIVE_FOLDER_ID se o ID mudar.\n' +
          'Detalhe Google: ' +
          text,
      );
    }
    throw new Error(`Falha no upload Drive (${res.status}): ${text}`);
  }

  let id = '';
  try {
    id = JSON.parse(text).id || '';
  } catch {
    id = '';
  }
  console.log(`[drive] CSV enviado: ${fileName}${id ? ` · id=${id}` : ''}`);
  return id || fileName;
}

function buildGoogleAuth(): GoogleAuth {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || '';
  const scopes = [DRIVE_SCOPE];

  if (raw.startsWith('{')) {
    return new GoogleAuth({
      credentials: JSON.parse(raw) as JWTInput,
      scopes,
    });
  }

  const keyFile =
    (raw && !raw.startsWith('{') ? raw : '') ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    config.drive.serviceAccountPath;

  if (!keyFile || !fs.existsSync(keyFile)) {
    throw new Error(
      'DRIVE_FOLDER_ID está definido, mas a service account não foi encontrada. ' +
        'Preencha GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_SERVICE_ACCOUNT_JSON.',
    );
  }

  return new GoogleAuth({ keyFile, scopes });
}
