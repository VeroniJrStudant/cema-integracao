import fs from 'node:fs';
import { chromium } from 'playwright';
import { ensureAuthenticated } from './auth/login.js';
import { config } from './config.js';
import { uploadCsvToDrive } from './drive/upload-csv.js';
import { prepareRelatorio196A } from './pages/relatorio-196a.js';

/**
 * Login + MFA → Empresa → Relatórios → Banco → 196A → filtros → para.
 */
async function main(): Promise<void> {
  const headed = config.headed;
  console.log('[crawler] Superlógica — Playwright (login + 196A)');
  console.log(`[crawler] baseUrl: ${config.baseUrl}`);
  console.log(`[crawler] Chrome headed=${headed} (janela deve aparecer na tela)`);

  const hasState = fs.existsSync(config.storageStatePath);
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !headed,
    slowMo: headed ? 250 : 0,
    args: headed ? ['--start-maximized'] : [],
  });

  const context = await browser.newContext({
    ...(hasState ? { storageState: config.storageStatePath } : {}),
    viewport: headed ? null : { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  try {
    await ensureAuthenticated(context, page);
    console.log(`[crawler] autenticado · URL: ${page.url()}`);

    const result = await prepareRelatorio196A(page);
    console.log(
      `[crawler] ok — 196A · URL: ${result.url} · shot: ${result.screenshotPath}` +
        (result.csvPath ? ` · csv: ${result.csvPath}` : ''),
    );

    if (result.csvPath) {
      try {
        await uploadCsvToDrive(result.csvPath);
      } catch (driveErr) {
        console.warn(
          '[crawler] CSV gerado, mas o envio ao Drive falhou (ok no modo semi-manual):',
          driveErr instanceof Error ? driveErr.message : driveErr,
        );
        console.warn(
          '[crawler] Arraste o CSV para a pasta Drive e use Importar CSV do Drive na planilha.',
        );
      }
    }

    if (headed) {
      console.log('[crawler] mantendo janela aberta 45s para você visualizar…');
      await new Promise((r) => setTimeout(r, 45_000));
    }
  } catch (err) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.mkdirSync(config.outputDir, { recursive: true });
    const failShot = `${config.outputDir}/fail-${stamp}.png`;
    await page.screenshot({ path: failShot, fullPage: true }).catch(() => undefined);
    console.error('[crawler] falhou:', err);
    console.error(`[crawler] screenshot: ${failShot}`);
    if (headed) {
      console.log('[crawler] mantendo janela aberta 30s após erro…');
      await new Promise((r) => setTimeout(r, 30_000));
    }
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main();
