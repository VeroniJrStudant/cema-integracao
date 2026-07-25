/**
 * Testes de datas para Taxa Adm — API Superlógica usa m/d/Y.
 * Rode no Apps Script: executarTestesDatasTaxaAdm()
 *
 * Regra: NÃO usar parse BR flex em dt_credito_recb.
 * "03/06/2026" na API = 6 de março, não 3 de junho.
 */
function executarTestesDatasTaxaAdm() {
  var ini = new Date(2026, 5, 1);  // 01/06/2026
  var fim = new Date(2026, 5, 30); // 30/06/2026
  var periodo = { inicioDate: ini, fimDate: fim };

  var casos = [
    { v: '06/01/2026', entra: true, desc: 'API m/d = 1 jun' },
    { v: '06/09/2026', entra: true, desc: 'API m/d = 9 jun' },
    { v: '06/30/2026', entra: true, desc: 'API m/d = 30 jun' },
    { v: '2026-06-09', entra: true, desc: 'ISO 9 jun' },
    { v: '03/06/2026', entra: false, desc: 'API m/d = 6 mar (não é 3 jun)' },
    { v: '09/06/2026', entra: false, desc: 'API m/d = 6 set' },
    { v: '05/31/2026', entra: false, desc: '31 mai' },
    { v: '07/01/2026', entra: false, desc: '1 jul' }
  ];

  var ok = 0;
  var fail = 0;
  var linhas = ['TESTE DATAS TAXA ADM — API m/d/Y — 01/06/2026 a 30/06/2026', ''];

  casos.forEach(function (c) {
    var entra = dataValorNoPeriodoApiUs_(c.v, periodo);
    var passou = entra === c.entra;
    if (passou) ok++; else fail++;
    linhas.push(
      (passou ? 'OK  ' : 'FAIL') + ' | ' + c.v +
      ' | us=' + entra + ' | esperado=' + c.entra +
      ' | ' + c.desc
    );
  });

  var repOk = {
    dt_credito_recb: '06/09/2026',
    fl_status_rep: '1',
    vl_txadm_rep: '329.06',
    proprietarios_beneficiarios: [{ st_nome_pes: 'Teste', nm_fracao_prb: '100' }]
  };
  var repMar = {
    dt_credito_recb: '03/06/2026',
    fl_status_rep: '1',
    vl_txadm_rep: '150',
    proprietarios_beneficiarios: [{ st_nome_pes: 'Teste2', nm_fracao_prb: '100' }]
  };

  linhas.push('');
  linhas.push('Repasse 06/09 (9 jun) no período: ' + repasseNoPeriodoPdf_(repOk, periodo));
  linhas.push('Repasse 03/06 (6 mar) no período: ' + repasseNoPeriodoPdf_(repMar, periodo));
  linhas.push('Linhas expand 9 jun: ' + expandirLinhasTaxaAdmRepasse_(repOk).length);

  linhas.push('');
  linhas.push('Resumo: OK=' + ok + ' FAIL=' + fail);
  Logger.log(linhas.join('\n'));
  SpreadsheetApp.getUi().alert(linhas.join('\n').substring(0, 1800));
  return { ok: ok, fail: fail };
}
