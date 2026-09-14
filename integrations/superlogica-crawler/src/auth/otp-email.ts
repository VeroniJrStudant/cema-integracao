import { ImapFlow } from 'imapflow';
import { config } from '../config.js';

export type OtpWaitOptions = {
  /** Só considera e-mails recebidos a partir deste instante (ms epoch). */
  sinceMs: number;
};

function extractOtp(text: string): string | null {
  const match = text.match(config.otp.regex);
  return match?.[1] ?? match?.[0] ?? null;
}

function textFromSource(raw: Buffer | false | undefined): string {
  if (!raw) return '';
  return raw.toString('utf8');
}

/**
 * Aguarda um e-mail MFA na inbox alternativa e extrai o código/token.
 */
export async function waitForOtpFromEmail(
  options: OtpWaitOptions,
): Promise<string> {
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: true,
    auth: {
      user: config.imap.user(),
      pass: config.imap.password(),
    },
    logger: false,
  });

  const deadline = Date.now() + config.otp.timeoutMs;
  const fromNeedle = config.imap.fromFilter.toLowerCase();
  const subjectNeedle = config.imap.subjectFilter.toLowerCase();

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      while (Date.now() < deadline) {
        const sinceDate = new Date(options.sinceMs - 60_000);
        for await (const msg of client.fetch(
          { since: sinceDate },
          { envelope: true, source: true, uid: true },
        )) {
          const internalDate = msg.internalDate
            ? new Date(msg.internalDate).getTime()
            : 0;
          if (internalDate && internalDate < options.sinceMs - 30_000) {
            continue;
          }

          const from =
            msg.envelope?.from
              ?.map((a) => `${a.name ?? ''} <${a.address ?? ''}>`)
              .join(' ')
              .toLowerCase() ?? '';
          const subject = (msg.envelope?.subject ?? '').toLowerCase();

          if (fromNeedle && !from.includes(fromNeedle)) continue;
          if (subjectNeedle && !subject.includes(subjectNeedle)) continue;

          const body = textFromSource(msg.source);
          const otp = extractOtp(`${subject}\n${body}`);
          if (otp) {
            console.log(
              `[otp] código copiado (uid=${msg.uid}) — e-mail mantido até MFA ok`,
            );
            return otp;
          }
        }

        await new Promise((r) => setTimeout(r, 3000));
      }
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }

  throw new Error(
    `OTP não chegou em ${config.otp.timeoutMs / 1000}s (IMAP ${config.imap.host})`,
  );
}
