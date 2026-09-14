import path from 'node:path';
import { controlleConfig, parseArgs } from '../config.js';
import { parseCsv196a, rowsElegiveis, type Csv196aRow } from '../csv/parse-196a.js';
import { brDateToIso } from '../mappers/entrada.js';
import type { EntradaUnicaPayload } from '../clients/controlle.js';

/**
 * Monta payload de preview.
 * Se IDs ainda não estão no .env, usa placeholders (não faz POST).
 */
function mapRowPreview(row: Csv196aRow): {
  payload: EntradaUnicaPayload;
  idsReais: boolean;
  avisos: string[];
} {
  const ids = controlleConfig.tryIds();
  const avisos: string[] = [];
  const idsReais = ids.categoria != null && ids.centro != null && ids.conta != null;

  const categoria = ids.categoria ?? 0;
  const centro = ids.centro ?? 0;
  const conta = ids.conta ?? 0;

  if (ids.categoria == null) avisos.push('CONTROLLE_ID_CATEGORIA_3112 ausente → placeholder 0');
  if (ids.centro == null) avisos.push('CONTROLLE_ID_CENTRO_INTERMEDIACAO ausente → placeholder 0');
  if (ids.conta == null) avisos.push('CONTROLLE_ID_CONTA_PADRAO ausente → placeholder 0');

  const competencia =
    brDateToIso(row.credito) ||
    brDateToIso(row.vencimento) ||
    new Date().toISOString().slice(0, 10);
  const due =
    brDateToIso(row.vencimento) ||
    brDateToIso(row.credito) ||
    competencia;
  const billing = brDateToIso(row.credito);
  const pago = Boolean(billing);

  const contrato = row.numeroContrato ? `Contrato ${row.numeroContrato}` : 'Contrato ?';
  const ds = `Taxa adm ${contrato} — ${row.descricao}`.slice(0, 240);

  const payment: EntradaUnicaPayload['payments'][0] = {
    situation: pago ? 1 : 0,
    value_in_cent: row.valorCentavos,
    dt_due: due,
  };
  if (pago && billing) {
    payment.id_accounts_paid = conta;
    payment.payment_in_cent = row.valorCentavos;
    payment.dt_billing = billing;
  }

  return {
    idsReais,
    avisos,
    payload: {
      ds_transaction: ds,
      dt_competence: competencia,
      activity_type: 1,
      repeat_type: 1,
      type: 0,
      id_accounts_main: conta,
      obs_transaction: `chave=${row.chave}; csv_index=${row.index}; PREVIEW_ONLY`,
      itens: [
        {
          id_plan_accounts_entities: categoria,
          id_cost_centers: centro,
          value_in_cent: row.valorCentavos,
        },
      ],
      payments: [payment],
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const csvArg = args.csv;
  if (typeof csvArg !== 'string' || !csvArg) {
    console.error(
      'Uso: npm run post:dry -- --csv ../superlogica-crawler/output/arquivo.csv [--samples 3]',
    );
    process.exit(1);
  }

  const samples = Math.max(1, Number(args.samples ?? 3));
  const csvPath = path.resolve(csvArg);
  const all = parseCsv196a(csvPath);
  const elegiveis = rowsElegiveis(all);

  console.log('========== PREVIEW (NÃO ENVIA PARA O CONTROLLE) ==========');
  console.log(`CSV: ${csvPath}`);
  console.log(`Linhas totais: ${all.length}`);
  console.log(`Elegíveis (valor > 0): ${elegiveis.length}`);
  console.log(`Ignoradas (valor <= 0): ${all.length - elegiveis.length}`);
  console.log('Destino pretendido: entrada · categoria 3.1.12 · centro Intermediação');
  console.log('==========================================================\n');

  if (!elegiveis.length) {
    console.log('Nada para montar.');
    return;
  }

  const n = Math.min(samples, elegiveis.length);
  for (let i = 0; i < n; i++) {
    const row = elegiveis[i];
    const { payload, idsReais, avisos } = mapRowPreview(row);

    console.log(`--- Amostra ${i} (csv elegível index=${row.index}) ---`);
    console.log('Origem CSV:');
    console.log(
      JSON.stringify(
        {
          credito: row.credito,
          vencimento: row.vencimento,
          contrato: row.numeroContrato,
          valorRaw: row.valorRaw,
          valorCentavos: row.valorCentavos,
          valorReais: (row.valorCentavos / 100).toFixed(2),
          descricao: row.descricao.slice(0, 120),
          chave: row.chave,
        },
        null,
        2,
      ),
    );
    console.log('\nPayload que SERIA enviado no POST:');
    console.log(JSON.stringify(payload, null, 2));
    console.log(
      `\nSituação: ${payload.payments[0].situation === 1 ? 'PAGO' : 'PENDENTE'} | ` +
        `IDs no .env: ${idsReais ? 'OK' : 'INCOMPLETOS (placeholders 0)'}`,
    );
    if (avisos.length) {
      for (const a of avisos) console.log(`  aviso: ${a}`);
    }
    console.log('');
  }

  console.log('Nenhuma requisição HTTP foi feita.');
  console.log('Próximos passos:');
  console.log('  1) npm run resolve-ids   (com token no .env)');
  console.log('  2) preencher IDs no .env');
  console.log('  3) npm run post:dry -- --csv ...   (de novo, com IDs reais)');
  console.log('  4) npm run post:one -- --csv ... --index 0   (aí sim envia 1)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
