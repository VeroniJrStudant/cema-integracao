import path from 'node:path';
import { controlleConfig, parseArgs } from '../config.js';
import { criarEntradaUnica, ControlleHttpError } from '../clients/controlle.js';
import { parseCsv196a, rowsElegiveis } from '../csv/parse-196a.js';
import { mapRowToEntrada } from '../mappers/entrada.js';
import { hasOk, loadStore, markErro, markOk, saveStore } from '../store/sync-store.js';

function extractId(resp: unknown): string | undefined {
  if (!resp || typeof resp !== 'object') return undefined;
  const o = resp as Record<string, unknown>;
  for (const key of ['id', 'id_transaction', 'id_transactions']) {
    const v = o[key];
    if (typeof v === 'number' || typeof v === 'string') return String(v);
  }
  if (o.data && typeof o.data === 'object') return extractId(o.data);
  return undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postWithRetry(payload: ReturnType<typeof mapRowToEntrada>, attempts = 3) {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await criarEntradaUnica(payload);
    } catch (err) {
      last = err;
      const status = err instanceof ControlleHttpError ? err.status : 0;
      if (status === 429 || status >= 500) {
        await sleep(500 * Math.pow(2, i));
        continue;
      }
      throw err;
    }
  }
  throw last;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvArg = args.csv;
  if (typeof csvArg !== 'string' || !csvArg) {
    console.error('Uso: npm run sync:csv -- --csv path/arquivo.csv [--limit N]');
    process.exit(1);
  }

  const limit = args.limit != null ? Number(args.limit) : undefined;
  const csvPath = path.resolve(csvArg);
  const elegiveis = rowsElegiveis(parseCsv196a(csvPath));
  const batch = limit && limit > 0 ? elegiveis.slice(0, limit) : elegiveis;

  const store = loadStore();
  let enviados = 0;
  let ignorados = 0;
  let erros = 0;

  console.log(`CSV: ${csvPath}`);
  console.log(`Elegíveis: ${elegiveis.length} | neste lote: ${batch.length}`);

  for (const row of batch) {
    if (hasOk(store, row.chave)) {
      ignorados++;
      continue;
    }
    try {
      const payload = mapRowToEntrada(row);
      const resp = await postWithRetry(payload);
      markOk(store, {
        chave: row.chave,
        idControlle: extractId(resp),
        valorCentavos: row.valorCentavos,
        dsTransaction: payload.ds_transaction,
      });
      enviados++;
      console.log(`OK #${row.index} contrato=${row.numeroContrato || '-'} R$ ${(row.valorCentavos / 100).toFixed(2)}`);
    } catch (err) {
      erros++;
      const msg = err instanceof Error ? err.message : String(err);
      const body =
        err instanceof ControlleHttpError ? err.body : '';
      markErro(store, row.chave, row.valorCentavos, `${msg} ${body}`.trim());
      console.error(`ERRO #${row.index}: ${msg}`);
    }
    // leve throttle
    await sleep(120);
  }

  saveStore(store);
  console.log('\n=== Resumo ===');
  console.log(`enviados=${enviados} ignorados=${ignorados} erros=${erros}`);
  console.log(`store=${controlleConfig.storePath}`);
  if (erros) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
