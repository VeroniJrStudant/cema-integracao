import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Frame, Page } from 'playwright';
import { config } from '../config.js';
import { waitForOtpFromEmail } from './otp-email.js';
import {
  deleteUsedOtpEmailsFromGmail,
  purgeSuperlogicaOtpEmails,
  waitForOtpFromGmailBrowser,
} from './otp-gmail-browser.js';

type Target = Page | Frame;

async function fillFirst(
  root: Target,
  selectors: string[],
  value: string,
): Promise<boolean> {
  for (const sel of selectors) {
    const loc = root.locator(sel).first();
    if ((await loc.count()) === 0) continue;
    try {
      await loc.fill(value, { timeout: 5_000 });
      return true;
    } catch {
      try {
        await loc.click({ timeout: 2_000 });
        await loc.fill(value, { force: true, timeout: 5_000 });
        return true;
      } catch {
        /* next */
      }
    }
  }
  return false;
}

async function clickFirst(root: Target, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    const loc = root.locator(sel).first();
    if ((await loc.count()) === 0) continue;
    try {
      await loc.click({ timeout: 5_000 });
      return true;
    } catch {
      try {
        await loc.click({ force: true, timeout: 5_000 });
        return true;
      } catch {
        /* next */
      }
    }
  }
  return false;
}

async function dumpDebug(page: Page, label: string): Promise<void> {
  fs.mkdirSync(config.outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shot = path.join(config.outputDir, `debug-${label}-${stamp}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
  const inputs = await page
    .evaluate(() =>
      Array.from(document.querySelectorAll('input')).map((el) => ({
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.id,
        visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      })),
    )
    .catch(() => []);
  console.log(`[auth:debug] ${label} url=${page.url()}`);
  console.log(`[auth:debug] inputs=${JSON.stringify(inputs)}`);
  console.log(`[auth:debug] screenshot=${shot}`);
}

function isAppAuthenticated(url: string): boolean {
  if (/login\.superlogica\.net/i.test(url)) return false;
  if (/error\.php/i.test(url)) return false;
  // Portal apps (entrada correta da Imobiliárias)
  if (/apps\.superlogica\.net\/imobiliaria/i.test(url)) return true;
  // Tenant clássico /clients/ (evitar host em manutenção como destino preferencial)
  return (
    /superlogica\.net\/clients\//i.test(url) &&
    !/areadocliente|login/i.test(url) &&
    !/cemaimobiliaria\.superlogica\.net/i.test(url)
  );
}

function isMfaChallenge(url: string): boolean {
  return /mfa-email-challenge|mfa-/i.test(url);
}

/** Landing = portal apps (o mesmo que você usa no browser). */
function appLandingUrl(): string {
  return config.baseUrl.replace(/\/$/, '') || 'https://apps.superlogica.net/imobiliaria';
}

/**
 * Após login, permanece no portal apps — evita host em manutenção.
 */
async function ensureSafeLanding(page: Page): Promise<void> {
  const landing = appLandingUrl();
  console.log(`[auth] forçando landing: ${landing}`);
  await page.goto(landing, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  if (/cemaimobiliaria\.superlogica\.net/i.test(page.url())) {
    console.log('[auth] host em manutenção — voltando ao portal apps');
    await page.goto(landing, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await new Promise((r) => setTimeout(r, 3000));
  }

  const body = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
  if (body.includes('está em manutenção') || body.includes('esta em manutencao')) {
    console.warn('[auth] página ainda mostra manutenção — verifique o BASE_URL');
  }

  console.log(`[auth] landing ok: ${page.url()}`);
}

function isUniversalLogin(url: string): boolean {
  return /login\.superlogica\.net/i.test(url);
}

async function roots(page: Page): Promise<Target[]> {
  return [page, ...page.frames().filter((f) => f !== page.mainFrame())];
}

async function fillInAnyFrame(
  page: Page,
  selectors: string[],
  value: string,
): Promise<boolean> {
  for (const root of await roots(page)) {
    if (await fillFirst(root, selectors, value)) return true;
  }
  return false;
}

async function clickInAnyFrame(page: Page, selectors: string[]): Promise<boolean> {
  for (const root of await roots(page)) {
    if (await clickFirst(root, selectors)) return true;
  }
  return false;
}

async function waitForManualOtp(page: Page): Promise<string> {
  console.log(
    '[auth] Digite o código OTP na tela do Superlógica (até 120s)…',
  );
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (isAppAuthenticated(page.url())) {
      return '__already_authed__';
    }
    if (!/mfa-email-challenge/i.test(page.url())) {
      // saiu da MFA sem a gente preencher (usuário digitou)
      if (isAppAuthenticated(page.url()) || /superlogica\.net\/clients/i.test(page.url())) {
        return '__already_authed__';
      }
    }
    const value = await page
      .locator('input#code, input[name="code"]')
      .first()
      .inputValue()
      .catch(() => '');
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) {
      console.log(`[auth] OTP manual detectado (${digits.length} dígitos)`);
      return digits;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('OTP manual não informado a tempo');
}

async function fetchOtp(
  context: BrowserContext,
  page: Page,
  sinceMs: number,
): Promise<string> {
  if (config.otp.via === 'imap') {
    return waitForOtpFromEmail({ sinceMs });
  }
  if (config.otp.via === 'manual') {
    return waitForManualOtp(page);
  }
  try {
    return await waitForOtpFromGmailBrowser(context, { sinceMs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[auth] Gmail OTP falhou:', msg);
    console.log('[auth] Contornando busca Gmail → OTP manual na tela');
    return waitForManualOtp(page);
  }
}

async function ensureRememberDevice(page: Page): Promise<void> {
  const box = page
    .locator('input#rememberBrowser, input[name="rememberBrowser"][type="checkbox"]')
    .first();
  const label = page
    .getByText(/Lembrar deste dispositivo( por 30 dias)?/i)
    .first();

  if (await label.isVisible().catch(() => false)) {
    const already = await box.isChecked().catch(() => false);
    if (!already) {
      await label.click({ force: true }).catch(() => undefined);
    }
  }

  if ((await box.count()) > 0) {
    if (!(await box.isChecked().catch(() => false))) {
      await box.check({ force: true }).catch(() => undefined);
    }
    if (!(await box.isChecked().catch(() => false))) {
      await page.evaluate(() => {
        const el = document.querySelector<HTMLInputElement>(
          '#rememberBrowser, input[name="rememberBrowser"][type="checkbox"]',
        );
        if (!el) return;
        el.checked = true;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  const checked = await box.isChecked().catch(() => false);
  console.log(
    `[auth] lembrar dispositivo 30 dias: ${checked ? 'checado' : 'não encontrado/não checado'}`,
  );
}

async function maybeCompleteMfa(
  context: BrowserContext,
  page: Page,
  _sinceMs: number,
): Promise<void> {
  const otpSelectors = [
    'input[name*="code" i]',
    'input[name*="codigo" i]',
    'input[name*="token" i]',
    'input[name*="otp" i]',
    'input[name*="mfa" i]',
    'input[autocomplete="one-time-code"]',
    'input[inputmode="numeric"]',
    'input[type="tel"]',
    'input[placeholder*="código" i]',
    'input[placeholder*="codigo" i]',
    'input[placeholder*="code" i]',
  ];

  for (let i = 0; i < 15; i++) {
    if (isAppAuthenticated(page.url())) {
      console.log('[auth] já autenticado — MFA não necessário');
      return;
    }

    const bodyText = (
      await page.locator('body').innerText().catch(() => '')
    ).toLowerCase();
    const hintsMfa =
      /código|codigo|code|autentica|verifica|token|2fa|mfa|e-mail|email/.test(
        bodyText,
      );

    let otpFieldFound = false;
    for (const root of await roots(page)) {
      for (const sel of otpSelectors) {
        if ((await root.locator(sel).count()) > 0) {
          otpFieldFound = true;
          break;
        }
      }
      if (otpFieldFound) break;
    }

    if (otpFieldFound || (hintsMfa && isUniversalLogin(page.url()))) {
      console.log('[auth] MFA detectado');
      await ensureRememberDevice(page);

      let lastErr: Error | null = null;

      // Até 3 ciclos. Ciclo 1: e-mail do login (caixa já limpa antes).
      // Ciclos 2–3: apaga tudo → Reenviar → pega o mais recente.
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[auth] ciclo OTP ${attempt}/3`);

        if (attempt > 1 && config.otp.via !== 'imap') {
          console.log('[auth] apagando OTPs antigos no Gmail (auth@superlogica.com)…');
          await purgeSuperlogicaOtpEmails(context).catch((err) => {
            console.warn('[auth] limpeza Gmail falhou:', err);
          });
          await page.bringToFront();
        }

        const resend = page.getByRole('link', { name: /Reenviar|Resend/i });
        const otpSince = Date.now();
        if (attempt > 1 || (await resend.isVisible().catch(() => false))) {
          if (await resend.isVisible().catch(() => false)) {
            console.log('[auth] reenviando código fresco…');
            await resend.click();
            console.log('[auth] clicado em Reenviar');
            await new Promise((r) => setTimeout(r, 5000));
          } else if (attempt > 1) {
            console.warn('[auth] botão Reenviar não visível');
            await new Promise((r) => setTimeout(r, 3000));
          }
        } else {
          // Primeiro código do login já a caminho
          console.log('[auth] aguardando e-mail OTP do login…');
          await new Promise((r) => setTimeout(r, 4000));
        }

        let otp: string;
        try {
          otp = await fetchOtp(context, page, otpSince);
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error(String(err));
          console.warn(`[auth] falha ao obter OTP (ciclo ${attempt}):`, lastErr.message);
          continue;
        }

        if (otp === '__already_authed__') {
          console.log('[auth] MFA concluído manualmente');
          return;
        }

        await page.bringToFront();
        await new Promise((r) => setTimeout(r, 400));

        const codeInput = page.locator('input#code, input[name="code"]').first();
        await codeInput.waitFor({ state: 'visible', timeout: 15_000 });
        await codeInput.click({ clickCount: 3 });
        await codeInput.fill('');
        await codeInput.pressSequentially(otp, { delay: 40 });
        console.log(`[auth] OTP preenchido no MFA: ${otp}`);

        await ensureRememberDevice(page);
        await page.locator('button[type="submit"]').first().click();
        await page
          .waitForURL((url) => !/mfa-email-challenge/i.test(url.href), {
            timeout: 45_000,
          })
          .catch(() => undefined);
        await new Promise((r) => setTimeout(r, 1500));
        await dumpDebug(page, 'after-mfa-submit');

        if (!/mfa-email-challenge/i.test(page.url())) {
          if (config.otp.via !== 'imap') {
            console.log('[auth] MFA ok — apagando e-mails OTP usados…');
            await deleteUsedOtpEmailsFromGmail(context).catch((err) => {
              console.warn('[auth] não foi possível apagar e-mail OTP:', err);
            });
            await page.bringToFront();
          }
          return;
        }

        const errText = await page.locator('body').innerText().catch(() => '');
        console.warn(
          `[auth] OTP rejeitado (ciclo ${attempt}). Trecho:`,
          errText.slice(0, 300),
        );
        lastErr = new Error('OTP rejeitado ou expirado na tela MFA');
      }

      throw lastErr ?? new Error('OTP rejeitado ou expirado na tela MFA');
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('[auth] MFA não detectado após espera');
}

async function loginSuperlogicaNative(page: Page): Promise<void> {
  const user = config.user();
  const password = config.password();
  console.log(`[auth] login nativo Superlógica: ${user}`);

  const userFilled = await fillInAnyFrame(page, [
    'input#username',
    'input[name="username"]',
    'input[name="email"]',
    'input[type="email"]',
    'input[name="login"]',
    'input[autocomplete="username"]',
  ], user);
  if (!userFilled) {
    throw new Error('Campo de usuário Superlógica não encontrado');
  }

  // Auth0 às vezes tem usuário → Continuar → senha
  const continueBtn = page.getByRole('button', {
    name: /Continuar|Continue|Avançar|Next|Entrar|Login/i,
  });
  if (await continueBtn.first().isVisible().catch(() => false)) {
    const passVisible = await page
      .locator('input[type="password"]')
      .first()
      .isVisible()
      .catch(() => false);
    if (!passVisible) {
      await continueBtn.first().click();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const passFilled = await fillInAnyFrame(page, [
    'input#password',
    'input[name="password"]',
    'input[type="password"]',
    'input[autocomplete="current-password"]',
  ], password);
  if (!passFilled) {
    throw new Error('Campo de senha Superlógica não encontrado');
  }

  const submit = page.locator(
    'button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Continuar")',
  ).first();
  await submit.click();
  await page
    .waitForURL(
      /mfa-email-challenge|apps\.superlogica\.net|superlogica\.net\/clients|accounts\.google\.com|error\.php/i,
      { timeout: 45_000 },
    )
    .catch(() => undefined);
  await new Promise((r) => setTimeout(r, 1500));
  await dumpDebug(page, 'after-native-login');
}

/**
 * Login Superlógica nativo (Renata) + OTP via Gmail (Veroni).
 * Aceita SUPERLOGICA_START_URL (ex.: MFA challenge) como entrada.
 */
export async function ensureAuthenticated(
  context: BrowserContext,
  page: Page,
): Promise<void> {
  // Entrada padrão = portal apps.
  const startUrl = config.startUrl || appLandingUrl();
  console.log(`[auth] abrindo alvo ${startUrl}`);
  await page.goto(startUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await new Promise((r) => setTimeout(r, 2000));
  await dumpDebug(page, 'start');

  if (isAppAuthenticated(page.url())) {
    console.log('[auth] sessão existente parece válida');
    await ensureSafeLanding(page);
    return;
  }

  const sinceMs = Date.now();

  // Limpa OTPs antigos ANTES de entrar no Superlógica / MFA
  if (config.otp.via !== 'imap') {
    console.log('[auth] limpando OTPs Superlógica no Gmail antes do login…');
    await purgeSuperlogicaOtpEmails(context).catch((err) => {
      console.warn('[auth] limpeza pré-login falhou:', err);
    });
    await page.bringToFront();
  }

  // Já está na tela MFA (URL de challenge fornecida)
  if (isMfaChallenge(page.url())) {
    console.log('[auth] já na MFA Superlógica — completando OTP…');
    await maybeCompleteMfa(context, page, sinceMs);
  } else {
    if (!isUniversalLogin(page.url())) {
      await page
        .waitForURL(/login\.superlogica\.net/i, { timeout: 20_000 })
        .catch(() => undefined);
    }
    if (!isUniversalLogin(page.url()) && !isMfaChallenge(page.url())) {
      console.log('[auth] redirecionando para landing para forçar login…');
      await page.goto(appLandingUrl(), {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (isMfaChallenge(page.url())) {
      console.log('[auth] redirecionou para MFA — completando OTP…');
      await maybeCompleteMfa(context, page, sinceMs);
    } else if (isUniversalLogin(page.url())) {
      console.log('[auth] sessão inválida — login nativo Superlógica');
      await loginSuperlogicaNative(page);
      if (isMfaChallenge(page.url()) || !isAppAuthenticated(page.url())) {
        await maybeCompleteMfa(context, page, sinceMs);
      }
    } else if (!isAppAuthenticated(page.url())) {
      await dumpDebug(page, 'no-universal-login');
      throw new Error(`Esperava login.superlogica.net ou MFA, URL: ${page.url()}`);
    }
  }

  if (!isAppAuthenticated(page.url())) {
    console.log('[auth] pós-MFA — abrindo landing…');
    await page.goto(appLandingUrl(), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await new Promise((r) => setTimeout(r, 2500));
  }

  if (isMfaChallenge(page.url())) {
    console.log('[auth] ainda em MFA após reload — tentando OTP…');
    await maybeCompleteMfa(context, page, Date.now());
    if (!isAppAuthenticated(page.url())) {
      await page.goto(appLandingUrl(), {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  if (!isAppAuthenticated(page.url())) {
    await dumpDebug(page, 'still-login');
    throw new Error(`Login/MFA não concedeu acesso. URL: ${page.url()}`);
  }

  // Garante landing no portal apps
  await ensureSafeLanding(page);

  fs.mkdirSync(config.authDir, { recursive: true });
  await context.storageState({ path: config.storageStatePath });
  console.log(`[auth] storageState salvo em ${config.storageStatePath}`);
}
