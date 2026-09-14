import path from 'node:path';
import { parseArgs } from '../config.js';
import { criarEntradaUnica } from '../clients/controlle.js';
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
  if (o.data && typeof o.data === 'object') {
    return extractId(o.data);
  }
  return undefined;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvArg = args.csv;
  if (typeof csvArg !== 'string' || !csvArg) {
    console.error('Uso: npm run post:one -- --csv path/arquivo.csv [--index 0]');
    process.exit(1);
  }

  const index = Number(args.index ?? 0);
  const csvPath = path.resolve(csvArg);
  const elegiveis = rowsElegiveis(parseCsv196a(csvPath));

  if (!elegiveis.length) {
    console.error('Nenhuma linha elegível (valor > 0).');
    process.exit(1);
  }
  if (index < 0 || index >= elegiveis.length) {
    console.error(`index inválido. Use 0..${elegiveis.length - 1}`);
    process.exit(1);
  }

  const row = elegiveis[index];
  const store = loadStore();
  if (hasOk(store, row.chave)) {
    console.log('Já sincronizado (store):', store.entries[row.chave]);
    return;
  }

  const payload = mapRowToEntrada(row);
  console.log('POST entrada única…');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const resp = await criarEntradaUnica(payload);
    const id = extractId(resp);
    markOk(store, {
      chave: row.chave,
      idControlle: id,
      valorCentavos: row.valorCentavos,
      dsTransaction: payload.ds_transaction,
    });
    saveStore(store);
    console.log('\nOK — resposta Controlle:');
    console.log(JSON.stringify(resp, null, 2));
    console.log(`\nConferir na UI: Financeiro → Intermediação → categoria 3.1.12`);
    if (id) console.log(`id: ${id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const body = err && typeof err === 'object' && 'body' in err ? String((err as { body: string }).body) : '';
    markErro(store, row.chave, row.valorCentavos, `${msg} ${body}`.trim());
    saveStore(store);
    console.error('Falha POST:', msg);
    if (body) console.error(body);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
