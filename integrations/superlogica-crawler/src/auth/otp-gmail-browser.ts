import type { BrowserContext, Page } from 'playwright';
import { config } from '../config.js';

/** Busca precisa dos e-mails de OTP da Superlógica. */
const OTP_SEARCH =
  'from:auth@superlogica.com subject:"Seu código de verificação Superlógica"';
const OTP_SEARCH_NEWER =
  'from:auth@superlogica.com subject:"Seu código de verificação Superlógica" newer_than:1h';

function extractOtp(text: string): string | null {
  const pt = text.match(/c[oó]digo de verifica[cç][aã]o [eé]:\s*(\d{4,8})/i);
  if (pt?.[1]) return pt[1];
  const en = text.match(/verification code is:\s*(\d{4,8})/i);
  if (en?.[1]) return en[1];
  const six = text.match(/(?<!\d)(\d{6})(?!\d)/);
  if (six?.[1]) return six[1];
  const match = text.match(config.otp.regex);
  return match?.[1] ?? match?.[0] ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function searchUrl(query: string): string {
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`;
}

async function ensureGmailLoggedIn(page: Page): Promise<void> {
  console.log(`[gmail] abrindo ${config.gmail.url}`);
  await page.goto(config.gmail.url, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await sleep(2000);

  const url = page.url();
  if (/mail\.google\.com\/mail/i.test(url) && !/accounts\.google/i.test(url)) {
    console.log('[gmail] já parece logado no inbox');
    return;
  }

  const emailInput = page
    .locator('#identifierId, input[name="identifier"], input[type="email"]')
    .first();
  if (
    (await emailInput.count()) > 0 &&
    (await emailInput.isVisible().catch(() => false))
  ) {
    console.log('[gmail] preenchendo e-mail…');
    await emailInput.click();
    await emailInput.fill('');
    await emailInput.pressSequentially(config.gmail.user(), { delay: 25 });
    await page
      .locator(
        '#identifierNext button, button:has-text("Next"), button:has-text("Avançar"), button:has-text("Próximo")',
      )
      .first()
      .click();
    await sleep(2500);
  }

  const passInput = page
    .locator(
      'input[type="password"][name="Passwd"], input[name="Passwd"], #password input[type="password"]',
    )
    .first();
  await passInput.waitFor({ state: 'visible', timeout: 45_000 });
  console.log('[gmail] preenchendo senha…');
  await passInput.click();
  await passInput.fill('');
  await passInput.pressSequentially(config.gmail.password(), { delay: 25 });
  await page
    .locator(
      '#passwordNext button, button:has-text("Next"), button:has-text("Avançar"), button:has-text("Próximo")',
    )
    .first()
    .click();

  await page
    .waitForURL(/mail\.google\.com\/mail/i, { timeout: 60_000 })
    .catch(() => undefined);
  await sleep(2500);

  if (/challenge|signin\/v2\/challenge/i.test(page.url())) {
    throw new Error(
      'Gmail pediu verificação extra (challenge). Complete manualmente na janela e rode de novo.',
    );
  }

  if (!/mail\.google\.com\/mail/i.test(page.url())) {
    throw new Error(`Não entrou no Gmail. URL atual: ${page.url()}`);
  }
  console.log('[gmail] inbox ok');
}

async function deleteOpenMessage(page: Page): Promise<void> {
  const delBtn = page
    .locator(
      'div[aria-label="Delete"], div[aria-label="Excluir"], div[data-tooltip="Delete"], div[data-tooltip="Excluir"]',
    )
    .first();
  if (await delBtn.isVisible().catch(() => false)) {
    await delBtn.click();
  } else {
    await page.keyboard.press('#');
  }
  await sleep(800);
}

async function readOpenMessageBody(page: Page): Promise<string> {
  return (
    (await page.locator('div.a3s.aiL').first().innerText().catch(() => '')) ||
    (await page.locator('div[role="main"]').innerText().catch(() => ''))
  );
}

async function countSearchRows(page: Page, query: string): Promise<number> {
  await page.goto(searchUrl(query), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await sleep(1500);
  return page.locator('tr.zA').count();
}

/**
 * Seleciona e apaga todos os resultados da busca atual (até esvaziar).
 */
async function deleteAllInCurrentSearch(page: Page): Promise<number> {
  let deleted = 0;

  for (let round = 0; round < 8; round++) {
    const rows = page.locator('tr.zA');
    const count = await rows.count();
    if (count === 0) break;

    // Seleciona cada linha
    for (let i = 0; i < count; i++) {
      const box = rows
        .nth(i)
        .locator('td div[role="checkbox"], td .oZ-jc, td .T-Jo')
        .first();
      if (await box.isVisible().catch(() => false)) {
        await box.click({ force: true }).catch(() => undefined);
      }
    }
    await sleep(400);

    const delBtn = page
      .locator(
        'div[aria-label="Delete"], div[aria-label="Excluir"], div[data-tooltip="Delete"], div[data-tooltip="Excluir"]',
      )
      .first();
    if (await delBtn.isVisible().catch(() => false)) {
      await delBtn.click();
    } else {
      await page.keyboard.press('#');
    }
    await sleep(1200);
    deleted += count;

    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await sleep(1200);
  }

  return deleted;
}

/**
 * Apaga TODOS os e-mails OTP Superlógica (auth@superlogica.com).
 * Chamar ANTES do login/Reenviar para não pegar código velho.
 */
export async function purgeSuperlogicaOtpEmails(
  context: BrowserContext,
): Promise<number> {
  const gmail = await context.newPage();
  try {
    await ensureGmailLoggedIn(gmail);
    console.log(`[gmail] limpando OTPs: ${OTP_SEARCH}`);
    await gmail.goto(searchUrl(OTP_SEARCH), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await sleep(2000);

    const before = await gmail.locator('tr.zA').count();
    if (before === 0) {
      console.log('[gmail] caixa OTP já limpa');
      return 0;
    }

    const deleted = await deleteAllInCurrentSearch(gmail);
    console.log(`[gmail] apagados ${deleted} e-mail(s) OTP antigos`);
    return deleted;
  } finally {
    await gmail.close().catch(() => undefined);
  }
}

/** Compat: limpa de verdade (não só marcar como lido). */
export async function ignoreStaleOtpEmailsInGmail(
  context: BrowserContext,
): Promise<void> {
  await purgeSuperlogicaOtpEmails(context);
}

/**
 * Espera o e-mail OTP MAIS RECENTE chegar (após limpeza + Reenviar).
 * Só considera mensagens da busca Superlógica; abre a 1ª linha (mais nova).
 */
export async function waitForOtpFromGmailBrowser(
  context: BrowserContext,
  options: { sinceMs: number },
): Promise<string> {
  const gmail = await context.newPage();
  const pollMs = config.otp.pollIntervalMs;
  const maxAttempts = Math.max(3, Math.ceil(config.otp.timeoutMs / pollMs));
  const seenOtps = new Set<string>();

  try {
    await ensureGmailLoggedIn(gmail);

    console.log(
      `[gmail] aguardando OTP mais recente — até ${maxAttempts}x / ${pollMs / 1000}s (após ${new Date(options.sinceMs).toISOString()})`,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (gmail.isClosed()) {
        throw new Error('Aba do Gmail foi fechada durante a espera do OTP');
      }

      const count = await countSearchRows(gmail, OTP_SEARCH_NEWER);
      console.log(
        `[gmail] tentativa ${attempt}/${maxAttempts} — ${count} e-mail(s) OTP`,
      );

      if (count > 0) {
        // 1ª linha = mais recente no Gmail
        const rows = gmail.locator('tr.zA');
        await rows.first().click();
        await sleep(1500);

        const bodyText = await readOpenMessageBody(gmail);
        console.log(
          `[gmail] trecho (mais recente): ${bodyText.slice(0, 180).replace(/\s+/g, ' ')}`,
        );
        const otp = extractOtp(bodyText);
        if (otp) {
          if (seenOtps.has(otp) && attempt < maxAttempts) {
            console.log(
              `[gmail] OTP ${otp} já visto — esperando e-mail mais novo…`,
            );
          } else {
            console.log(`[gmail] OTP mais recente copiado: ${otp}`);
            return otp;
          }
        } else {
          console.log('[gmail] e-mail sem OTP legível');
        }
      }

      if (attempt < maxAttempts) {
        await sleep(pollMs);
      }
    }

    throw new Error(
      `OTP não encontrado no Gmail em ${maxAttempts} tentativas (~${config.otp.timeoutMs / 1000}s)`,
    );
  } finally {
    await gmail.close().catch(() => undefined);
  }
}

/**
 * Apaga e-mails OTP após MFA ok (mesma limpeza completa).
 */
export async function deleteUsedOtpEmailsFromGmail(
  context: BrowserContext,
): Promise<void> {
  const n = await purgeSuperlogicaOtpEmails(context);
  if (n === 0) {
    // fallback: tenta apagar o aberto via busca recente
    const gmail = await context.newPage();
    try {
      await ensureGmailLoggedIn(gmail);
      const count = await countSearchRows(gmail, OTP_SEARCH_NEWER);
      if (count > 0) {
        await gmail.locator('tr.zA').first().click();
        await sleep(1000);
        await deleteOpenMessage(gmail);
        console.log('[gmail] e-mail OTP mais recente apagado após MFA ok');
      }
    } finally {
      await gmail.close().catch(() => undefined);
    }
  }
}
