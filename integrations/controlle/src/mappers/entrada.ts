import { controlleConfig } from '../config.js';
import type { EntradaUnicaPayload } from '../clients/controlle.js';
import type { Csv196aRow } from '../csv/parse-196a.js';

/** dd/mm/yyyy → yyyy-mm-dd */
export function brDateToIso(raw: string): string | null {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

export function mapRowToEntrada(row: Csv196aRow): EntradaUnicaPayload {
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

  const ids = {
    categoria: controlleConfig.idCategoria3112,
    centro: controlleConfig.idCentroIntermediacao,
    conta: controlleConfig.idContaPadrao,
  };

  const payment: EntradaUnicaPayload['payments'][0] = {
    situation: pago ? 1 : 0,
    value_in_cent: row.valorCentavos,
    dt_due: due,
  };

  if (pago && billing) {
    payment.id_accounts_paid = ids.conta;
    payment.payment_in_cent = row.valorCentavos;
    payment.dt_billing = billing;
  }

  return {
    ds_transaction: ds,
    dt_competence: competencia,
    activity_type: 1,
    repeat_type: 1,
    type: 0,
    id_accounts_main: ids.conta,
    obs_transaction: `chave=${row.chave}; csv_index=${row.index}`,
    itens: [
      {
        id_plan_accounts_entities: ids.categoria,
        id_cost_centers: ids.centro,
        value_in_cent: row.valorCentavos,
      },
    ],
    payments: [payment],
  };
}
