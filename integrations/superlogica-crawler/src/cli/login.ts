import fs from 'node:fs';
import { chromium } from 'playwright';
import { ensureAuthenticated } from '../auth/login.js';
import { config } from '../config.js';

/**
 * Força login + MFA e grava storageState (útil no primeiro setup).
 * Rode com PLAYWRIGHT_HEADED=true para acompanhar a tela.
 */
async function main(): Promise<void> {
  if (fs.existsSync(config.storageStatePath)) {
    fs.unlinkSync(config.storageStatePath);
    console.log('[login] storageState anterior removido');
  }

  const headed = config.headed;
  console.log(`[login] Chrome headed=${headed} (janela deve aparecer na tela)`);
  console.log(`[login] baseUrl=${config.baseUrl}`);

  // Usa o Google Chrome do sistema (visível) em vez do Chromium baixado pelo Playwright
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !headed,
    slowMo: headed ? 250 : 0,
    args: headed ? ['--start-maximized'] : [],
  });
  const context = await browser.newContext({
    viewport: headed ? null : { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    await ensureAuthenticated(context, page);
    console.log('[login] ok — sessão salva em', config.storageStatePath);
    if (headed) {
      console.log('[login] mantendo janela aberta 60s para você visualizar…');
      await new Promise((r) => setTimeout(r, 60_000));
    }
  } catch (err) {
    console.error('[login] falhou:', err);
    if (headed) {
      console.log('[login] mantendo janela aberta 30s após erro…');
      await new Promise((r) => setTimeout(r, 30_000));
    }
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main();
