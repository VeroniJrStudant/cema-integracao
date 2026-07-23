var CONFIG = {
  SPREADSHEET_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  API_BASE: 'https://apps.superlogica.net/imobiliaria/api/cobrancas',
  ITENS_POR_PAGINA: 100,
  COM_STATUS: 'todas',
  ABA_RECEBIMENTOS: 'Recebimentos', // cabeçalhos = json-ex-schema.json
  ABA_COMPOSICAO: 'Composição',     // array compo_recebimento
  ABA_RESUMO: 'Resumo Analítico',
  ABA_LOG: 'Log Importação',
  // Campo usado no filtro local de reforço (API usa dtInicio/dtFim)
  // Opções: dt_vencimento_recb | dt_liquidacao_recb | dt_competencia_recb | dt_recebimento_recb | dt_geracao_recb
  CAMPO_FILTRO_DATA: 'dt_vencimento_recb'
};

/**
 * Cabeçalhos exatamente como em json-ex-schema.json (tipo !== list).
 * Arrays (compo_recebimento, split_indisponivel) vão para abas próprias.
 */
var SCHEMA_COBRANCAS = [
  'acessovistoonline',
  'ar_nomeformas_calc',
  'comconfirmacaoleitura',
  'descontoatedia',
  'descontovalorfixo',
  'dt_acordo_recb',
  'dt_alteracao_recb',
  'dt_alteracao_sincro',
  'dt_cancelamento_recb',
  'dt_cartaotransacao_recb',
  'dt_cieloultimatentativa_recb',
  'dt_competencia_recb',
  'dt_congelamento_sac',
  'dt_desativacao_sac',
  'dt_fechamento_cfe',
  'dt_geracao_recb',
  'dt_ignorarstatus_sac',
  'dt_impressao_recb',
  'dt_liquidacao_recb',
  'dt_pedidobaixapjbank_recb',
  'dt_pedidoregistropjbank_recb',
  'dt_previsaocredito_recb',
  'dt_recebimento_recb',
  'dt_suspensaocancelada_recb',
  'dt_vencimento_recb',
  'dt_vencimentooriginal_recb',
  'era_cartao',
  'fl_acordofrentedecaixa_recb',
  'fl_cartao_recb',
  'fl_cieloforcarpagamento_recb',
  'fl_cofre',
  'fl_composicao_recb',
  'fl_conciliado_recb',
  'fl_consultartidtardio_recb',
  'fl_conta_homologada',
  'fl_contratoprorrogado_recb',
  'fl_converterparanota_recb',
  'fl_desconsiderarcontabilidade_recb',
  'fl_despesasvinculadas_recb',
  'fl_geracaonotificada_recb',
  'fl_ignorarbloqueioauto_recb',
  'fl_importacao_recb',
  'fl_motivocancelar_recb',
  'fl_nossonumerofixo_recb',
  'fl_online_recb',
  'fl_pagamentopref_sac',
  'fl_pessoajuridica_sac',
  'fl_primeiranotificacao_recb',
  'fl_primeiranotificacaocart_recb',
  'fl_primeiranotificacaosms_recb',
  'fl_proratadia_recb',
  'fl_protestado_recb',
  'fl_quartanotificacao_recb',
  'fl_quintanotificacao_recb',
  'fl_remessastatus_recb',
  'fl_remessastatuscr_recb',
  'fl_segundanotificacao_recb',
  'fl_segundanotificacaocarta_recb',
  'fl_segundanotificacaosms_recb',
  'fl_sextanotificacao_recb',
  'fl_status_recb',
  'fl_status_spl',
  'fl_statussecuritizadora_recb',
  'fl_temcomissao_recb',
  'fl_terceiranotificacao_recb',
  'fl_terceiranotificacaosms_recb',
  'fl_tipoentrega_recb',
  'fl_txdescontopersonalizada_recb',
  'id_adesao_plc',
  'id_admcartoes_adc',
  'id_bandeira_ban',
  'id_cheque_pre',
  'id_conta_cb',
  'id_contaorigem_recb',
  'id_contaoriginal_cb',
  'id_contrato_mens',
  'id_empresa_emp',
  'id_endereco_sen',
  'id_fechamento_cfe',
  'id_filial_fil',
  'id_forma_frecb',
  'id_formaboleto_frecb',
  'id_formapagamento_recb',
  'id_lote_recb',
  'id_nota_not',
  'id_online_recb',
  'id_operacaopjbank_recb',
  'id_operacaosecuritizadora_recb',
  'id_partidacontabil_pc',
  'id_partidacontabilbaixa_pc',
  'id_partidacontabilliquidacao_pc',
  'id_recebimento_recb',
  'id_recebimentoantigo_recb',
  'id_renovacao_plc',
  'id_sacado_sac',
  'id_split_recb',
  'id_transacao_ctr',
  'id_usuario_usu',
  'identificador_leitura',
  'link_2via',
  'link_2via_json',
  'msgdiasparadesconto',
  'nm_anocartaovencimento_sac',
  'nm_cartao_sac',
  'nm_conveniopropriopjbank_recb',
  'nm_descontoatedia_recb',
  'nm_impressoes_recb',
  'nm_mescartaovencimento_sac',
  'nm_parcelacartao_recb',
  'nm_remessa_recb',
  'nm_tagcriacao_recb',
  'nm_tagliquidacao_recb',
  'nm_tentativascartao_recb',
  'nm_tentativasenviocr_recb',
  'nm_versaorecebimento_recb',
  'nm_versaorecebimentopjbank_recb',
  'nm_visto_recb',
  'nome_formatado',
  'publickey',
  'publickey_json',
  'st_accesskeycr_recb',
  'st_banco_sac',
  'st_cartaobandeira_recb',
  'st_cartaobandeira_sac',
  'st_cartaodetalhes_recb',
  'st_cep_sac',
  'st_cgc_sac',
  'st_cielotid_recb',
  'st_cielotidcancelamento_recb',
  'st_codigoerrocartao_recb',
  'st_codmovimentacaorem_recb',
  'st_complementocomposicao_recb',
  'st_complementolancignorado_recb',
  'st_descricao_cb',
  'st_documentoex_recb',
  'st_email_sac',
  'st_errocartao_recb',
  'st_falhacartao_recb',
  'st_hashemailpag_recb',
  'st_hashparcelamento_recb',
  'st_idexterno_recb',
  'st_instrucoes_recb',
  'st_label_mens',
  'st_label_recb',
  'st_label2_recb',
  'st_label3_recb',
  'st_maquina_recb',
  'st_marcador_calc',
  'st_marcador_recb',
  'st_md5_recb',
  'st_motivocanceloutros_recb',
  'st_nf_recb',
  'st_nome_sac',
  'st_nomeref_sac',
  'st_nossonumero_recb',
  'st_numeroautorizacao_recb',
  'st_numerocartao_recb',
  'st_observacao_recb',
  'st_observacaoexterna_recb',
  'st_observacaointerna_recb',
  'st_pixqrcode_recb',
  'st_sincro_sac',
  'st_splitdados_recb',
  'st_telefone_sac',
  'st_tidconciliacao_recb',
  'st_tokendaconta_recb',
  'st_tokenfacilitador_recb',
  'tipo_conta',
  'tx_bancaria',
  'tx_cartaomensagem_recb',
  'tx_remessamsg_recb',
  'vl_descontocalculado_recb',
  'vl_emitido_recb',
  'vl_taxacobranca_recb',
  'vl_total_recb',
  'vl_txdesconto_emp',
  'vl_txdesconto_recb',
  'vl_txjuros_emp',
  'vl_txjuros_recb',
  'vl_txmulta_emp',
  'vl_txmulta_recb',
  'vl_valorcreditado_calc'
];

/**
 * Campos de itens_schema de compo_recebimento (json-ex-schema.json).
 */
var SCHEMA_COMPOSICAO = [
  'dt_contratacao_comp',
  'fl_especial_comp',
  'fl_opcional_prd',
  'id_boleto_comp',
  'id_boletopmm_comp',
  'id_composicao_comp',
  'id_mensalidade_comp',
  'id_pedido_ped',
  'id_pgmtindevido_comp',
  'id_planocliente_plc',
  'id_planoconta_plc',
  'id_produto_prd',
  'id_retornoitemduplicado_reti',
  'id_sacado_comp',
  'id_vendedor_comp',
  'nm_quantidade_comp',
  'st_complemento_comp',
  'st_conta_cont',
  'st_descricao_comp',
  'st_descricao_prd',
  'st_mesano_comp',
  'st_sincro_comp',
  'st_sincrosac_comp',
  'st_valor_comp'
];

/**
 * Colunas sintéticas na aba Composição (para análise do usuário).
 * Vêm antes dos campos do schema.
 */
var COLUNAS_SINTETICAS_COMPOSICAO = [
  'id_recebimento_recb',
  'contrato',
  'id_sacado_sac',
  'st_nome_sac',
  'status_texto',
  'fl_status_recb',
  'dt_competencia_recb',
  'dt_vencimento_recb',
  'dt_liquidacao_recb',
  'vl_total_cobranca',
  'st_descricao_cb',
  'produto_sintetico',
  'valor_sintetico'
];

// ---------------------------------------------------------------------------
// Menu / tokens
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Superlógica')
    .addItem('📥 Importar tudo', 'importarCobrancas')
    .addItem('📅 Importar por período', 'importarCobrancasPorPeriodo')
    .addSeparator()
    .addItem('🔑 Configurar Tokens', 'configurarTokensUi')
    .addItem('🧪 Testar API (1 página)', 'executarTeste')
    .addToUi();
}

function configurarTokensUi() {
  var ui = SpreadsheetApp.getUi();
  var app = ui.prompt('App Token Superlógica', 'Cole o app_token:', ui.ButtonSet.OK_CANCEL);
  if (app.getSelectedButton() !== ui.Button.OK) return;
  var access = ui.prompt('Access Token Superlógica', 'Cole o access_token:', ui.ButtonSet.OK_CANCEL);
  if (access.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperties({
    APP_TOKEN: app.getResponseText().trim(),
    ACCESS_TOKEN: access.getResponseText().trim()
  });
  ui.alert('Tokens salvos com sucesso.');
}

function getTokens_() {
  var props = PropertiesService.getScriptProperties();
  var appToken = props.getProperty('APP_TOKEN');
  var accessToken = props.getProperty('ACCESS_TOKEN');
  if (!appToken || !accessToken) {
    throw new Error('Tokens não configurados. Use o menu Superlógica → Configurar Tokens.');
  }
  return { appToken: appToken, accessToken: accessToken };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

function extrairListaCobrancas_(payload) {
  // Formato real da API:
  // { status, msg, data: [ [ {...}, {...}, ... ] ], executiontime }
  // ou data: [ {...}, {...} ]
  var data = payload && payload.data !== undefined ? payload.data : payload;
  if (!data) return [];

  if (Array.isArray(data)) {
    // data = [ [ cobranças... ] ]
    if (data.length === 1 && Array.isArray(data[0])) {
      data = data[0];
    }
    return data.filter(function (x) {
      return x && typeof x === 'object' && !Array.isArray(x);
    });
  }

  if (typeof data === 'object') {
    if (Array.isArray(data.dados)) return data.dados;
    if (Array.isArray(data.items)) return data.items;
  }

  return [];
}

function buscarPaginaCobrancas_(pagina, periodo) {
  var tokens = getTokens_();
  var url = CONFIG.API_BASE +
    '?comStatus=' + encodeURIComponent(CONFIG.COM_STATUS) +
    '&itensPorPagina=' + CONFIG.ITENS_POR_PAGINA +
    '&pagina=' + pagina;

  // API Superlógica: datas no padrão MM/DD/YYYY
  if (periodo && periodo.inicioApi && periodo.fimApi) {
    url += '&dtInicio=' + encodeURIComponent(periodo.inicioApi) +
      '&dtFim=' + encodeURIComponent(periodo.fimApi);
  }

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      accept: 'application/json',
      app_token: tokens.appToken,
      access_token: tokens.accessToken
    },
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('API HTTP ' + code + ' (página ' + pagina + '): ' + text.substring(0, 400));
  }

  var payload = JSON.parse(text);
  if (payload && payload.status && Number(payload.status) >= 400) {
    throw new Error('API status ' + payload.status + ': ' + (payload.msg || text.substring(0, 300)));
  }

  return extrairListaCobrancas_(payload);
}

function teste() {
  return buscarPaginaCobrancas_(1, null);
}

function executarTeste() {
  var resultado = teste();
  Logger.log('Registros página 1: ' + resultado.length);
  SpreadsheetApp.getUi().alert('Teste OK\n\nPágina 1: ' + resultado.length + ' cobrança(s).');
  return resultado;
}

function buscarTodasCobrancas_(periodo) {
  var todas = [];
  var pagina = 1;
  while (pagina <= 500) {
    var lote = buscarPaginaCobrancas_(pagina, periodo || null);
    if (!lote.length) break;
    todas = todas.concat(lote);
    Logger.log('Página ' + pagina + ': ' + lote.length + ' | acumulado: ' + todas.length);
    if (lote.length < CONFIG.ITENS_POR_PAGINA) break;
    pagina++;
    Utilities.sleep(200);
  }

  // Reforço local: garante que só entram registros no período pelo campo escolhido
  if (periodo && periodo.inicioDate && periodo.fimDate) {
    var antes = todas.length;
    todas = filtrarPorPeriodoLocal_(todas, periodo);
    Logger.log('Filtro local (' + CONFIG.CAMPO_FILTRO_DATA + '): ' + antes + ' → ' + todas.length);
  }

  return todas;
}

/**
 * Converte data digitada pelo usuário.
 * Aceita: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
 * Retorna { api: 'MM/DD/YYYY', date: Date, br: 'DD/MM/YYYY' }
 */
function parseDataUsuario_(texto) {
  if (!texto) return null;
  var s = String(texto).trim();
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  var dia, mes, ano;
  if (m) {
    // Assume DD/MM/YYYY (padrão BR na UI)
    dia = Number(m[1]);
    mes = Number(m[2]);
    ano = Number(m[3]);
    // Se dia > 12, certamente DD/MM; se mes > 12, inválido
    if (mes > 12 && dia <= 12) {
      // usuário digitou MM/DD por engano
      var tmp = dia; dia = mes; mes = tmp;
    }
  } else {
    m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (!m) return null;
    ano = Number(m[1]);
    mes = Number(m[2]);
    dia = Number(m[3]);
  }

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  var d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;

  var mm = (mes < 10 ? '0' : '') + mes;
  var dd = (dia < 10 ? '0' : '') + dia;
  return {
    api: mm + '/' + dd + '/' + ano,   // MM/DD/YYYY para a API
    br: dd + '/' + mm + '/' + ano,
    date: d
  };
}

function parseDataApiField_(valor) {
  if (!valor) return null;
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor)) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  var s = String(valor).trim();
  // API retorna MM/DD/YYYY ou MM/DD/YYYY HH:mm:ss
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  var mes = Number(m[1]);
  var dia = Number(m[2]);
  var ano = Number(m[3]);
  return new Date(ano, mes - 1, dia);
}

function filtrarPorPeriodoLocal_(lista, periodo) {
  var campo = periodo.campoFiltro || CONFIG.CAMPO_FILTRO_DATA;
  var ini = periodo.inicioDate.getTime();
  var fim = periodo.fimDate.getTime();
  return lista.filter(function (item) {
    var d = parseDataApiField_(item[campo]);
    if (!d) return false;
    var t = d.getTime();
    return t >= ini && t <= fim;
  });
}

/**
 * Pergunta período ao usuário.
 * Retorna null se cancelar.
 */
function perguntarPeriodoUi_() {
  var ui = SpreadsheetApp.getUi();

  var campoResp = ui.prompt(
    'Campo da data',
    'Digite o número do campo para filtrar:\n' +
    '1 = Vencimento (dt_vencimento_recb)\n' +
    '2 = Liquidação (dt_liquidacao_recb)\n' +
    '3 = Competência (dt_competencia_recb)\n' +
    '4 = Recebimento (dt_recebimento_recb)\n' +
    '5 = Geração (dt_geracao_recb)\n\n' +
    'Padrão: 1',
    ui.ButtonSet.OK_CANCEL
  );
  if (campoResp.getSelectedButton() !== ui.Button.OK) return null;

  var mapaCampo = {
    '1': 'dt_vencimento_recb',
    '2': 'dt_liquidacao_recb',
    '3': 'dt_competencia_recb',
    '4': 'dt_recebimento_recb',
    '5': 'dt_geracao_recb',
    '': 'dt_vencimento_recb'
  };
  var escolha = String(campoResp.getResponseText() || '').trim();
  var campoFiltro = mapaCampo[escolha] || mapaCampo['1'];

  var iniResp = ui.prompt(
    'Data inicial',
    'Informe a data inicial (DD/MM/AAAA)\nEx.: 01/06/2026',
    ui.ButtonSet.OK_CANCEL
  );
  if (iniResp.getSelectedButton() !== ui.Button.OK) return null;
  var ini = parseDataUsuario_(iniResp.getResponseText());
  if (!ini) {
    ui.alert('Data inicial inválida. Use DD/MM/AAAA.');
    return null;
  }

  var fimResp = ui.prompt(
    'Data final',
    'Informe a data final (DD/MM/AAAA)\nEx.: 30/06/2026',
    ui.ButtonSet.OK_CANCEL
  );
  if (fimResp.getSelectedButton() !== ui.Button.OK) return null;
  var fim = parseDataUsuario_(fimResp.getResponseText());
  if (!fim) {
    ui.alert('Data final inválida. Use DD/MM/AAAA.');
    return null;
  }

  if (fim.date.getTime() < ini.date.getTime()) {
    ui.alert('A data final não pode ser anterior à data inicial.');
    return null;
  }

  return {
    inicioApi: ini.api,
    fimApi: fim.api,
    inicioBr: ini.br,
    fimBr: fim.br,
    inicioDate: ini.date,
    fimDate: fim.date,
    campoFiltro: campoFiltro,
    rotulo: ini.br + ' a ' + fim.br + ' (' + campoFiltro + ')'
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSs_() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function ensureSheet_(ss, nome) {
  var sh = ss.getSheetByName(nome);
  if (!sh) sh = ss.insertSheet(nome);
  return sh;
}

function limparAba_(sh) {
  sh.clearContents();
  sh.clearFormats();
  if (sh.getFilter()) sh.getFilter().remove();
}

function limparHtml_(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairContrato_(item) {
  var marcador = item.st_marcador_recb ? String(item.st_marcador_recb) : '';
  var m = marcador.match(/contrato\s*#?\s*(\d+)/i);
  if (m) return m[1];
  if (item.id_endereco_sen) return String(item.id_endereco_sen);
  return '';
}

function statusTexto_(fl) {
  var mapa = {
    '0': 'Em aberto',
    '1': 'Liquidada',
    '2': 'Cancelada',
    '3': 'Suspensa',
    '4': 'Em acordo'
  };
  var key = String(fl === null || fl === undefined ? '' : fl);
  return mapa[key] || ('Status ' + key);
}

function celula_(valor, campo) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object') {
    try { return JSON.stringify(valor); } catch (e) { return String(valor); }
  }
  // Campos HTML: deixa legível na planilha
  if (campo === 'nome_formatado' || campo === 'st_marcador_calc') {
    return limparHtml_(valor);
  }
  if (campo === 'st_complementocomposicao_recb') {
    return String(valor).replace(/\r?\n/g, ' | ');
  }
  return valor;
}

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function formatarCabecalho_(range) {
  range.setFontWeight('bold').setBackground('#1b4332').setFontColor('#ffffff').setWrap(true);
}

function escreverTabela_(sh, headers, rows) {
  limparAba_(sh);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatarCabecalho_(sh.getRange(1, 1, 1, headers.length));
  if (rows.length) {
    // Sheets limita ~10M células; grava em blocos
    var bloco = 500;
    for (var i = 0; i < rows.length; i += bloco) {
      var fatia = rows.slice(i, i + bloco);
      sh.getRange(2 + i, 1, fatia.length, headers.length).setValues(fatia);
    }
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, Math.max(rows.length, 1) + 1, headers.length).createFilter();
  sh.autoResizeColumns(1, Math.min(headers.length, 15));
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

function importarCobrancas() {
  executarImportacao_(null);
}

function importarCobrancasPorPeriodo() {
  var periodo = perguntarPeriodoUi_();
  if (!periodo) return;
  executarImportacao_(periodo);
}

function executarImportacao_(periodo) {
  var ui = SpreadsheetApp.getUi();
  var inicio = new Date();
  try {
    var cobrancas = buscarTodasCobrancas_(periodo);
    if (!cobrancas.length) {
      ui.alert(
        'Nenhuma cobrança retornada' +
        (periodo ? ' para o período ' + periodo.rotulo : '') + '.'
      );
      return;
    }

    var ss = getSs_();
    escreverRecebimentosSchema_(ss, cobrancas);
    escreverComposicaoSintetica_(ss, cobrancas);
    escreverResumo_(ss, cobrancas);
    escreverLog_(
      ss,
      cobrancas.length,
      inicio,
      null,
      periodo ? ('Período: ' + periodo.rotulo) : 'Importação completa (sem filtro de data)'
    );

    ui.alert(
      '✅ Importação concluída!\n\n' +
      cobrancas.length + ' recebimento(s)\n' +
      (periodo ? 'Período: ' + periodo.rotulo + '\n\n' : '\n') +
      'Abas:\n' +
      '• ' + CONFIG.ABA_RECEBIMENTOS + '\n' +
      '• ' + CONFIG.ABA_COMPOSICAO + '\n' +
      '• ' + CONFIG.ABA_RESUMO + '\n' +
      '• ' + CONFIG.ABA_LOG
    );
  } catch (err) {
    Logger.log(err);
    try {
      escreverLog_(getSs_(), 0, inicio, String(err.message || err), periodo ? periodo.rotulo : '');
    } catch (e2) {}
    ui.alert('⚠️ Erro:\n\n' + (err.message || err));
  }
}

/** Aba Recebimentos: 1 coluna por propriedade escalar do json-ex-schema.json. */
function escreverRecebimentosSchema_(ss, cobrancas) {
  var sh = ensureSheet_(ss, CONFIG.ABA_RECEBIMENTOS);

  // Remove aba antiga "Cobranças" se existir (versão anterior do script)
  var antiga = ss.getSheetByName('Cobranças');
  if (antiga && antiga.getName() !== CONFIG.ABA_RECEBIMENTOS) {
    try { ss.deleteSheet(antiga); } catch (e) { /* ignora se for a única aba */ }
  }
  var headers = SCHEMA_COBRANCAS.slice();

  var rows = cobrancas.map(function (item) {
    return headers.map(function (campo) {
      return celula_(item[campo], campo);
    });
  });

  escreverTabela_(sh, headers, rows);

  // Formatos numéricos/datas úteis (quando o índice existir)
  var idxVl = headers.indexOf('vl_total_recb');
  if (idxVl >= 0 && rows.length) {
    ['vl_emitido_recb', 'vl_total_recb', 'vl_valorcreditado_calc', 'vl_taxacobranca_recb',
      'vl_descontocalculado_recb', 'vl_txdesconto_emp', 'vl_txdesconto_recb',
      'vl_txjuros_emp', 'vl_txmulta_recb', 'tx_bancaria'].forEach(function (c) {
      var i = headers.indexOf(c);
      if (i >= 0) sh.getRange(2, i + 1, rows.length, 1).setNumberFormat('#,##0.00');
    });
  }
}

/**
 * Aba Composição: cada item de compo_recebimento em uma linha.
 * Colunas sintéticas (análise) + campos do itens_schema.
 */
function escreverComposicaoSintetica_(ss, cobrancas) {
  var sh = ensureSheet_(ss, CONFIG.ABA_COMPOSICAO);
  var headers = COLUNAS_SINTETICAS_COMPOSICAO.concat(SCHEMA_COMPOSICAO);
  var rows = [];

  cobrancas.forEach(function (item) {
    var compo = Array.isArray(item.compo_recebimento) ? item.compo_recebimento : [];
    var sintBase = [
      item.id_recebimento_recb || '',
      extrairContrato_(item),
      item.id_sacado_sac || '',
      item.st_nome_sac || '',
      statusTexto_(item.fl_status_recb),
      item.fl_status_recb,
      item.dt_competencia_recb || '',
      item.dt_vencimento_recb || '',
      item.dt_liquidacao_recb || '',
      num_(item.vl_total_recb),
      item.st_descricao_cb || ''
    ];

    if (!compo.length) {
      rows.push(sintBase.concat([
        '(sem composição)',
        num_(item.vl_total_recb)
      ]).concat(SCHEMA_COMPOSICAO.map(function () { return ''; })));
      return;
    }

    compo.forEach(function (c) {
      var produto = c.st_descricao_prd || c.st_descricao_comp || '';
      var valor = num_(c.st_valor_comp);
      var sint = sintBase.concat([produto, valor]);
      var schemaVals = SCHEMA_COMPOSICAO.map(function (campo) {
        return celula_(c[campo], campo);
      });
      rows.push(sint.concat(schemaVals));
    });
  });

  escreverTabela_(sh, headers, rows);

  if (rows.length) {
    var iValor = headers.indexOf('valor_sintetico');
    var iVlComp = headers.indexOf('st_valor_comp');
    var iTotal = headers.indexOf('vl_total_cobranca');
    if (iValor >= 0) sh.getRange(2, iValor + 1, rows.length, 1).setNumberFormat('#,##0.00');
    if (iVlComp >= 0) sh.getRange(2, iVlComp + 1, rows.length, 1).setNumberFormat('#,##0.00');
    if (iTotal >= 0) sh.getRange(2, iTotal + 1, rows.length, 1).setNumberFormat('#,##0.00');
  }
}

function escreverResumo_(ss, cobrancas) {
  var sh = ensureSheet_(ss, CONFIG.ABA_RESUMO);
  limparAba_(sh);

  var porStatus = {};
  var porProduto = {};
  var porContrato = {};
  var totalGeral = 0;

  cobrancas.forEach(function (item) {
    var st = statusTexto_(item.fl_status_recb);
    var total = num_(item.vl_total_recb);
    totalGeral += total;
    if (!porStatus[st]) porStatus[st] = { qtd: 0, total: 0 };
    porStatus[st].qtd++;
    porStatus[st].total += total;

    var contrato = extrairContrato_(item) || '(sem)';
    if (!porContrato[contrato]) porContrato[contrato] = { qtd: 0, total: 0, cliente: item.st_nome_sac || '' };
    porContrato[contrato].qtd++;
    porContrato[contrato].total += total;

    (item.compo_recebimento || []).forEach(function (c) {
      var p = c.st_descricao_prd || '(sem produto)';
      if (!porProduto[p]) porProduto[p] = { qtd: 0, total: 0 };
      porProduto[p].qtd++;
      porProduto[p].total += num_(c.st_valor_comp);
    });
  });

  var out = [];
  out.push(['RESUMO ANALÍTICO — schema json-ex-schema.json']);
  out.push(['Gerado em', new Date()]);
  out.push(['Total cobranças', cobrancas.length]);
  out.push(['Soma vl_total_recb', totalGeral]);
  out.push([]);
  out.push(['POR STATUS']);
  out.push(['status_texto', 'qtd', 'vl_total_recb']);
  Object.keys(porStatus).sort().forEach(function (k) {
    out.push([k, porStatus[k].qtd, porStatus[k].total]);
  });
  out.push([]);
  out.push(['POR PRODUTO (compo_recebimento.st_descricao_prd)']);
  out.push(['produto', 'qtd', 'st_valor_comp']);
  Object.keys(porProduto).sort(function (a, b) {
    return porProduto[b].total - porProduto[a].total;
  }).forEach(function (k) {
    out.push([k, porProduto[k].qtd, porProduto[k].total]);
  });
  out.push([]);
  out.push(['TOP CONTRATOS']);
  out.push(['contrato', 'cliente', 'qtd', 'vl_total_recb']);
  Object.keys(porContrato).map(function (k) {
    return { k: k, v: porContrato[k] };
  }).sort(function (a, b) {
    return b.v.total - a.v.total;
  }).slice(0, 50).forEach(function (o) {
    out.push([o.k, o.v.cliente, o.v.qtd, o.v.total]);
  });

  sh.getRange(1, 1, out.length, 4).setValues(out.map(function (r) {
    while (r.length < 4) r.push('');
    return r.slice(0, 4);
  }));
  sh.getRange(1, 1, 1, 4).merge().setFontWeight('bold').setBackground('#1b4332').setFontColor('#ffffff');
  sh.autoResizeColumns(1, 4);
}

function escreverLog_(ss, qtd, inicio, erro, detalheExtra) {
  var sh = ensureSheet_(ss, CONFIG.ABA_LOG);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Data/Hora', 'Quantidade', 'Duração (s)', 'Status', 'Detalhe']);
    formatarCabecalho_(sh.getRange(1, 1, 1, 5));
  }
  var detalhe = erro
    ? String(erro)
    : ('OK' + (detalheExtra ? ' | ' + detalheExtra : ''));
  sh.appendRow([
    new Date(),
    qtd,
    ((new Date()) - inicio) / 1000,
    erro ? 'ERRO' : 'OK',
    detalhe
  ]);
}
