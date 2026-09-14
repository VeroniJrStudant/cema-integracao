import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'playwright';
import { config } from '../config.js';

const RELATORIOS_INDEX =
  'https://apps.superlogica.net/imobiliaria/relatorios/index';
const RELATORIO_196A_PROXY =
  'https://apps.superlogica.net/imobiliaria/proxy/index?remoteController=relatorios&remoteId=196A';
const CATEGORIA = '1.1.1 Taxa de administração';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function dumpShot(page: Page, label: string): Promise<string> {
  fs.mkdirSync(config.outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shot = path.join(config.outputDir, `196a-${label}-${stamp}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
  console.log(`[196a] screenshot=${shot}`);
  return shot;
}

async function clickFirstVisible(
  page: Page,
  candidates: Array<() => ReturnType<Page['locator']>>,
  label: string,
): Promise<boolean> {
  for (const make of candidates) {
    const loc = make().first();
    if ((await loc.count()) === 0) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ timeout: 8_000 });
    console.log(`[196a] clicou: ${label}`);
    return true;
  }
  return false;
}

/**
 * Empresa (sidebar) → Relatórios
 */
async function goToRelatorios(page: Page): Promise<void> {
  console.log('[196a] abrindo menu Empresa → Relatórios…');

  // Garante home do portal apps
  if (!/apps\.superlogica\.net\/imobiliaria/i.test(page.url())) {
    await page.goto(config.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await sleep(2000);
  }

  const empresaClicked = await clickFirstVisible(
    page,
    [
      () => page.getByRole('link', { name: /^Empresa$/i }),
      () => page.getByRole('button', { name: /^Empresa$/i }),
      () => page.locator('a, button, [role="link"], [role="button"]').filter({
        hasText: /^Empresa$/i,
      }),
      () => page.locator('[title="Empresa"], [aria-label="Empresa"]'),
      () => page.locator('text=Empresa'),
    ],
    'Empresa',
  );

  if (empresaClicked) {
    // Submenu costuma abrir no hover
    const empresaLoc = page
      .locator('a, button, [role="link"], [role="button"]')
      .filter({ hasText: /^Empresa$/i })
      .first();
    await empresaLoc.hover().catch(() => undefined);
    await sleep(800);

    const relatoriosClicked = await clickFirstVisible(
      page,
      [
        () => page.getByRole('link', { name: /Relatórios/i }),
        () => page.locator('a').filter({ hasText: /Relatórios/i }),
        () =>
          page.locator(
            'a[href*="appController=relatorios"], a[href*="relatorios/index"], a[href*="remoteController=relatorios"]',
          ),
        () => page.getByText(/^Relatórios$/i),
      ],
      'Relatórios',
    );
    if (relatoriosClicked) {
      await page
        .waitForURL(/relatorios/i, { timeout: 30_000 })
        .catch(() => undefined);
      await sleep(2000);
      await dumpShot(page, 'relatorios');
      return;
    }
  }

  console.log('[196a] fallback: abrindo índice de relatórios direto');
  await page.goto(RELATORIOS_INDEX, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await sleep(2500);
  await dumpShot(page, 'relatorios');
}

/**
 * Card Banco → Movimentações por categoria (196A)
 */
async function openRelatorio196A(page: Page): Promise<void> {
  console.log('[196a] abrindo relatório 196A no card Banco…');

  // Tenta achar o card "Banco" e o link 196A dentro dele
  const bancoCard = page
    .locator('div, section, article, li')
    .filter({ hasText: /Banco/i })
    .filter({ hasText: /196A|Movimentações por categoria/i })
    .first();

  let clicked = false;
  if ((await bancoCard.count()) > 0) {
    const link = bancoCard
      .locator('a')
      .filter({ hasText: /Movimentações por categoria\s*\(196A\)|196A/i })
      .first();
    if ((await link.count()) > 0 && (await link.isVisible().catch(() => false))) {
      await link.click({ timeout: 10_000 });
      clicked = true;
      console.log('[196a] clicou no link 196A dentro do card Banco');
    }
  }

  if (!clicked) {
    const any196 = page
      .locator('a')
      .filter({ hasText: /Movimentações por categoria\s*\(196A\)/i })
      .first();
    if ((await any196.count()) > 0 && (await any196.isVisible().catch(() => false))) {
      await any196.click({ timeout: 10_000 });
      clicked = true;
      console.log('[196a] clicou no link 196A (sem card)');
    }
  }

  if (!clicked) {
    console.log('[196a] fallback: abrindo proxy 196A direto');
    await page.goto(RELATORIO_196A_PROXY, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }

  await page
    .waitForURL(/196A|relatorios\/id\/196A|remoteId=196A/i, { timeout: 45_000 })
    .catch(() => undefined);
  await sleep(3000);
  await dumpShot(page, 'form-196a');
}

/**
 * Vencimento → "Mês anterior" (competência fechada do mês passado).
 */
async function selectPeriodoVencimento(page: Page): Promise<void> {
  console.log('[196a] Vencimento → Mês anterior…');

  const mesAnteriorRe = /M[eê]s anterior/i;
  let selected = false;

  const selects = page.locator('select');
  const n = await selects.count();
  for (let i = 0; i < n; i++) {
    const sel = selects.nth(i);
    const opt = sel.locator('option').filter({ hasText: mesAnteriorRe });
    if ((await opt.count()) === 0) continue;

    const nearVenc = await sel
      .evaluate((el) => {
        const block = el.closest('div, tr, li, fieldset, form')?.textContent ?? '';
        return /vencimento/i.test(block);
      })
      .catch(() => false);

    const value = await opt.first().getAttribute('value');
    if (value == null) continue;

    if (nearVenc || !selected) {
      await sel.selectOption(value);
      selected = true;
      console.log(
        `[196a] período = Mês anterior${nearVenc ? ' (campo Vencimento)' : ''}`,
      );
      if (nearVenc) break;
    }
  }

  if (!selected) {
    const trigger = page
      .locator('div, button, a, span, select')
      .filter({
        hasText: /Selecionar per[ií]odo|M[eê]s atual|Este m[eê]s|M[eê]s anterior/i,
      })
      .first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
      await sleep(500);
      const opt = page
        .locator('li, a, div, span, option, button')
        .filter({ hasText: /^M[eê]s anterior$/i })
        .first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        selected = true;
        console.log('[196a] período = Mês anterior (dropdown custom)');
      }
    }
  }

  // Fallback: preencher datas do mês anterior em "Selecionar período"
  if (!selected) {
    const { inicio, fim } = datasMesAnterior_();
    console.log(`[196a] fallback datas ${inicio} → ${fim}`);
    const filled = await preencherDatasPeriodo_(page, inicio, fim);
    if (filled) {
      selected = true;
      console.log('[196a] período preenchido com datas do mês anterior');
    }
  }

  if (!selected) {
    console.warn('[196a] não encontrou opção "Mês anterior" em Vencimento');
  }
  await sleep(1000);
}

function datasMesAnterior_(): { inicio: string; fim: string } {
  const hoje = new Date();
  const primeiroDesteMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoMesAnterior = new Date(primeiroDesteMes.getTime() - 86400000);
  const primeiroMesAnterior = new Date(
    ultimoMesAnterior.getFullYear(),
    ultimoMesAnterior.getMonth(),
    1,
  );
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return { inicio: fmt(primeiroMesAnterior), fim: fmt(ultimoMesAnterior) };
}

async function preencherDatasPeriodo_(
  page: Page,
  inicio: string,
  fim: string,
): Promise<boolean> {
  // Garante modo "Selecionar período" se existir
  const selects = page.locator('select');
  const n = await selects.count();
  for (let i = 0; i < n; i++) {
    const sel = selects.nth(i);
    const opt = sel.locator('option').filter({ hasText: /Selecionar per[ií]odo/i });
    if ((await opt.count()) === 0) continue;
    const nearVenc = await sel
      .evaluate((el) => {
        const block = el.closest('div, tr, li, fieldset, form')?.textContent ?? '';
        return /vencimento/i.test(block);
      })
      .catch(() => false);
    if (!nearVenc) continue;
    const value = await opt.first().getAttribute('value');
    if (value != null) await sel.selectOption(value);
    break;
  }
  await sleep(600);

  const dateInputs = page.locator(
    'input[type="date"], input[placeholder*="dd" i], input[name*="data" i], input[id*="data" i], input.datepicker, input[class*="date" i]',
  );
  const count = await dateInputs.count();
  if (count >= 2) {
    await dateInputs.nth(0).fill(inicio);
    await dateInputs.nth(1).fill(fim);
    return true;
  }
  if (count === 1) {
    await dateInputs.nth(0).fill(`${inicio} - ${fim}`);
    return true;
  }

  // Campos texto genéricos perto de Vencimento
  const vencBlock = page
    .locator('div, tr, fieldset, form, section')
    .filter({ hasText: /Vencimento/i })
    .first();
  if (await vencBlock.isVisible().catch(() => false)) {
    const inputs = vencBlock.locator('input[type="text"], input:not([type])');
    const ic = await inputs.count();
    if (ic >= 2) {
      await inputs.nth(0).fill(inicio);
      await inputs.nth(1).fill(fim);
      return true;
    }
  }
  return false;
}

/**
 * Filtrar contas categorias → 1.1.1 Taxa de administração
 * No Superlógica o campo abre busca pelo botão "..." ao lado.
 */
async function selectCategoriaTaxaAdm(page: Page): Promise<void> {
  console.log(`[196a] categoria → ${CATEGORIA}`);

  const section = page
    .locator('div, section, fieldset, form')
    .filter({ hasText: /FILTRAR CONTAS CATEGORIAS/i })
    .first();

  if (await section.isVisible().catch(() => false)) {
    // se já tiver a categoria no filtro (chip/texto no bloco esquerdo)
    const already = section
      .getByText(/1\.1\.1\s*Taxa de administra/i)
      .first();
    if (await already.isVisible().catch(() => false)) {
      console.log('[196a] categoria já no filtro');
      return;
    }
  }

  // Botão "..." do campo Categoria (abre modal/lista)
  const dots = page
    .locator(
      'a[href*="categoria" i], button[title*="categoria" i], a.btn, button.btn, span.btn, a',
    )
    .filter({ hasText: /^\.\.\.$|^…$/ })
    .first();

  // Preferir "..." dentro da seção de categorias
  let opened = false;
  if ((await section.count()) > 0) {
    const dotsInSection = section
      .locator('a, button, span, i')
      .filter({ hasText: /^\.\.\.$|^…$/ })
      .first();
    if (await dotsInSection.isVisible().catch(() => false)) {
      await dotsInSection.click({ force: true });
      opened = true;
      console.log('[196a] abriu busca de categoria (...)');
    }
  }

  if (!opened && (await dots.isVisible().catch(() => false))) {
    await dots.click({ force: true });
    opened = true;
    console.log('[196a] abriu busca de categoria (...) global');
  }

  // Clique no input Categoria e no ícone de lupa/reticências vizinho
  if (!opened) {
    const label = page.getByText(/^Categoria$/i).first();
    if (await label.isVisible().catch(() => false)) {
      const row = label.locator(
        'xpath=ancestor::*[contains(@class,"form") or self::div or self::tr][1]',
      );
      const neighbor = row
        .locator('a, button, span')
        .filter({ hasText: /^\.\.\.$|^…$/ })
        .first();
      if (await neighbor.isVisible().catch(() => false)) {
        await neighbor.click({ force: true });
        opened = true;
      } else {
        // clica na área à direita do input (onde fica o ...)
        const input = row.locator('input').first();
        if (await input.isVisible().catch(() => false)) {
          const box = await input.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2);
            opened = true;
            console.log('[196a] click na borda direita do input Categoria');
          }
        }
      }
    }
  }

  await sleep(1500);

  // Modal / popup / iframe com lista de categorias
  const frames = [page, ...page.frames().filter((f) => f !== page.mainFrame())];
  let picked = false;

  for (const root of frames) {
    // campo de busca no modal
    const search = root
      .locator(
        'input[type="text"], input[type="search"], input[name*="busca" i], input[placeholder*="busca" i], input[placeholder*="pesquis" i]',
      )
      .first();
    if ((await search.count()) > 0 && (await search.isVisible().catch(() => false))) {
      await search.fill('');
      await search.pressSequentially('1.1.1', { delay: 40 });
      await sleep(1200);
    }

    const option = root
      .locator('a, td, tr, li, div, span, label')
      .filter({ hasText: /1\.1\.1\s*Taxa de administra/i })
      .first();
    if (await option.isVisible().catch(() => false)) {
      await option.click({ force: true });
      picked = true;
      console.log('[196a] categoria escolhida na lista/modal');
      await sleep(1000);
      break;
    }
  }

  // Fallback: digitar direto no input
  if (!picked) {
    const input = page
      .locator(
        'input[name*="categoria" i], input[id*="categoria" i], input[placeholder*="Categoria" i]',
      )
      .first();
    if (await input.isVisible().catch(() => false)) {
      await input.click({ clickCount: 3 });
      await input.fill('');
      await input.pressSequentially(CATEGORIA, { delay: 30 });
      await sleep(1000);
      await input.press('Enter').catch(() => undefined);
      console.log('[196a] categoria digitada no input (fallback)');
      await sleep(800);
    }
  }

  const confirmed = await page
    .locator('div, section, fieldset, form')
    .filter({ hasText: /FILTRAR CONTAS CATEGORIAS/i })
    .getByText(/1\.1\.1\s*Taxa de administra/i)
    .first()
    .isVisible()
    .catch(() => false);

  if (confirmed) {
    console.log('[196a] categoria confirmada no filtro');
  } else {
    console.warn('[196a] categoria pode não ter sido aplicada — veja screenshot');
  }
}

/**
 * DETALHAR → check "Detalhado"
 */
async function checkDetalhado(page: Page): Promise<void> {
  console.log('[196a] DETALHAR → marcar Detalhado…');

  // Expande a seção DETALHAR se estiver colapsada
  const detalharHeader = page
    .locator('a, button, div, span, h3, h4, legend')
    .filter({ hasText: /^DETALHAR$/i })
    .first();
  if (await detalharHeader.isVisible().catch(() => false)) {
    await detalharHeader.click({ force: true }).catch(() => undefined);
    await sleep(600);
  }

  const box = page.locator('#DETALHADO, input[name="DETALHADO"]').first();
  if ((await box.count()) > 0) {
    const already = await box.isChecked().catch(() => false);
    if (already) {
      console.log('[196a] Detalhado já estava marcado');
      return;
    }

    // Input pode estar visualmente escondido (UI custom) — força via DOM
    await box
      .check({ force: true })
      .catch(async () => {
        await page.evaluate(() => {
          const el = document.querySelector<HTMLInputElement>(
            '#DETALHADO, input[name="DETALHADO"]',
          );
          if (!el) return;
          el.checked = true;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.click();
        });
      });

    const checked = await box.isChecked().catch(() => false);
    console.log(
      checked
        ? '[196a] Detalhado marcado'
        : '[196a] tentativa de marcar Detalhado (estado incerto)',
    );
    return;
  }

  const label = page.getByText(/^Detalhado$/i).first();
  if (await label.isVisible().catch(() => false)) {
    await label.click({ force: true });
    console.log('[196a] clicou no texto Detalhado');
    return;
  }

  console.warn('[196a] checkbox Detalhado não encontrado');
}

const IMPRESSOES_INDEX =
  'https://imobiliariacema.superlogica.net/clients/financeiro/impressoes/index';

function csvTargetPath(stamp: string, suggested: string): string {
  let name = suggested
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-()+ ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!/\.csv$/i.test(name)) name = `${name || '196a'}.csv`;
  return path.join(config.outputDir, `196a-${stamp}-${name}`);
}

/**
 * Clica Exportar → Exportar CSV.
 * O Superlógica gera no histórico; baixamos em Impressões → Baixar arquivos
 * (ou via link documentos/download?id=…).
 */
async function exportarCsv(page: Page): Promise<string | null> {
  console.log('[196a] Exportar → Exportar CSV…');
  fs.mkdirSync(config.outputDir, { recursive: true });

  const exportBtn = page
    .getByRole('button', { name: /^Exportar$/i })
    .or(page.locator('a, button').filter({ hasText: /^Exportar$/i }))
    .first();

  if (!(await exportBtn.isVisible().catch(() => false))) {
    const alt = page.locator('button, a.btn').filter({ hasText: /Exportar/i }).first();
    if (!(await alt.isVisible().catch(() => false))) {
      throw new Error('Botão Exportar não encontrado');
    }
    await alt.click();
  } else {
    await exportBtn.click();
  }
  await sleep(800);

  const csvItem = page
    .getByRole('menuitem', { name: /Exportar CSV/i })
    .or(page.locator('a, button, li, span, div').filter({ hasText: /^Exportar CSV$/i }))
    .first();
  const csvTarget = (await csvItem.isVisible().catch(() => false))
    ? csvItem
    : page.getByText(/Exportar CSV/i).first();

  if (!(await csvTarget.isVisible().catch(() => false))) {
    await dumpShot(page, 'export-menu-missing');
    throw new Error('Opção "Exportar CSV" não encontrada no menu');
  }

  await csvTarget.click();
  console.log('[196a] Exportar CSV solicitado — aguardando histórico…');

  await page
    .getByText(/dispon[ií]vel no hist[oó]rico de impress/i)
    .first()
    .waitFor({ state: 'visible', timeout: 120_000 })
    .catch(() => undefined);

  await sleep(2500);
  await dumpShot(page, 'apos-gerar-csv');

  // Prefer "Mostrar tudo"; senão abre o índice de impressões direto
  const mostrar = page.getByText(/Mostrar tudo/i).first();
  if (await mostrar.isVisible().catch(() => false)) {
    console.log('[196a] abrindo Mostrar tudo (histórico completo)…');
    await Promise.all([
      page.waitForURL(/impressoes/i, { timeout: 45_000 }).catch(() => undefined),
      mostrar.click(),
    ]);
  } else {
    console.log('[196a] abrindo índice de impressões…');
    await page.goto(IMPRESSOES_INDEX, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
  }
  await sleep(3000);
  await dumpShot(page, 'historico-impressoes');

  // Link direto do 196A mais recente
  const downloadLink = page
    .locator('a[href*="documentos/download"]')
    .filter({ hasText: /196A/i })
    .first();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (await downloadLink.isVisible().catch(() => false)) {
    const href = await downloadLink.getAttribute('href');
    console.log(`[196a] link download: ${href}`);

    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);
    await downloadLink.click();
    const download = await downloadPromise;
    if (download) {
      const suggested = download.suggestedFilename() || '196a.csv';
      const target = csvTargetPath(stamp, suggested);
      await download.saveAs(target);
      console.log(`[196a] CSV salvo: ${target}`);
      await dumpShot(page, 'apos-export-csv');
      return target;
    }

    if (href) {
      const abs = new URL(href, page.url()).toString();
      const resp = await page.request.get(abs);
      if (resp.ok()) {
        const body = await resp.body();
        const cd = resp.headers()['content-disposition'] ?? '';
        const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
        const suggested = m?.[1] ?? '196a.csv';
        const target = csvTargetPath(stamp, suggested);
        fs.writeFileSync(target, body);
        console.log(`[196a] CSV salvo (GET link): ${target}`);
        return target;
      }
    }
  }

  // Fallback: marcar linha + Baixar arquivos
  console.log('[196a] fallback: marcar 196A + Baixar arquivos…');
  const marked = await page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll('tr[id*="FilaImpressoes"], tr[id*="Impressoes"]'),
    );
    for (const tr of rows) {
      const t = tr.textContent || '';
      if (!/196A/i.test(t)) continue;
      if (/\{indice\}/.test(tr.innerHTML)) continue;
      const cb = tr.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (!cb) continue;
      cb.click();
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      return tr.id;
    }
    return null;
  });

  if (!marked) {
    await dumpShot(page, 'historico-sem-checkbox');
    throw new Error('Não achou linha 196A para baixar no histórico');
  }
  console.log(`[196a] linha marcada: ${marked}`);
  await sleep(800);

  const baixar = page
    .locator('a, button')
    .filter({ hasText: /Baixar arquivos/i })
    .first();
  if (!(await baixar.isVisible().catch(() => false))) {
    throw new Error('Botão "Baixar arquivos" não encontrado');
  }

  const downloadPromise = page.waitForEvent('download', { timeout: 90_000 }).catch(() => null);
  const responsePromise = page
    .waitForResponse(
      (r) =>
        r.status() === 200 &&
        (/baixar=1|forcarDownload|documentos\/download|\.csv/i.test(r.url()) ||
          /csv|octet-stream/i.test(r.headers()['content-type'] ?? '')),
      { timeout: 90_000 },
    )
    .catch(() => null);

  await baixar.click({ force: true });

  const download = await downloadPromise;
  if (download) {
    const suggested = download.suggestedFilename() || '196a.csv';
    const target = csvTargetPath(stamp, suggested);
    await download.saveAs(target);
    console.log(`[196a] CSV salvo: ${target}`);
    await dumpShot(page, 'apos-export-csv');
    return target;
  }

  const response = await responsePromise;
  if (response) {
    const body = await response.body().catch(() => null);
    if (body && body.length > 0) {
      const cd = response.headers()['content-disposition'] ?? '';
      const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
      const suggested = m?.[1] ?? '196a.csv';
      const target = csvTargetPath(stamp, suggested);
      fs.writeFileSync(target, body);
      console.log(`[196a] CSV salvo (response): ${target}`);
      return target;
    }
  }

  await dumpShot(page, 'export-sem-download');
  throw new Error('Histórico aberto, mas o CSV não foi baixado');
}

/**
 * Após login: Empresa → Relatórios → Banco → 196A → filtros → Exportar CSV.
 */
export async function prepareRelatorio196A(page: Page): Promise<{
  url: string;
  screenshotPath: string;
  csvPath: string | null;
}> {
  await goToRelatorios(page);
  await openRelatorio196A(page);
  await selectPeriodoVencimento(page);
  await selectCategoriaTaxaAdm(page);
  await checkDetalhado(page);

  const screenshotPath = await dumpShot(page, 'filtros-ok');
  const csvPath = await exportarCsv(page);
  console.log(`[196a] pronto · URL: ${page.url()}`);
  return { url: page.url(), screenshotPath, csvPath };
}
