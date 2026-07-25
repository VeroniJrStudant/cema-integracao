/**
 * EXEMPLO / CONSULTA — versão ANTERIOR do script analítico.
 *
 * Arquivo de referência (não usar em produção).
 * Versão atual (com conferência PDF, rateio por proprietário e resumo):
 *   integrations/superlogica/src/superlogica-cobrancas-analitico.gs
 *
 * Esta cópia corresponde ao estado do script antes do ajuste de taxa adm
 * (1 linha por repasse, sem expandir proprietários; resumo sem bloco de conferência).
 */
var CONFIG = {
  SPREADSHEET_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  API_BASE: 'https://apps.superlogica.net/imobiliaria/api/cobrancas',
  API_CONTRATOS: 'https://apps.superlogica.net/imobiliaria/api/contratos',
  API_DESPESAS: 'https://apps.superlogica.net/imobiliaria/api/despesas',
  API_REPASSES: 'https://apps.superlogica.net/imobiliaria/api/repasses',
  ITENS_POR_PAGINA: 100,
  COM_STATUS: 'todas',
  // contratos: vazio = todos | ativos | 0 | 1 (conforme API)
  COM_STATUS_CONTRATOS: '',
  ABA_RECEBIMENTOS: 'Recebimentos', // schema filtrado (sem links/tokens/html/arrays)
  ABA_COMPOSICAO: 'Composição',     // array compo_recebimento
  ABA_CONTRATOS: 'Contratos',       // taxa administrativa cadastrada no contrato
  ABA_TAXA_ADM: 'Taxa Adm Realizada', // taxa nos repasses do período
  ABA_RESUMO: 'Resumo Analítico',
  ABA_LOG: 'Log Importação',
  // Campo usado no filtro local de reforço (API usa dtInicio/dtFim)
  // Opções: dt_vencimento_recb | dt_liquidacao_recb | dt_competencia_recb | dt_recebimento_recb | dt_geracao_recb
  CAMPO_FILTRO_DATA: 'dt_vencimento_recb',
  // Produto que identifica a taxa administrativa lançada (fonte secundária)
  PRODUTO_TAXA_ADM: 'taxa de administra',
  // Lotes paralelos UrlFetchApp.fetchAll para /repasses?idContrato=
  REPASSES_BATCH_SIZE: 40
};

/**
 * Cabeçalhos = json-ex-schema.json (escalares), excluindo propriedades sensíveis/pesadas.
 * 173 colunas (+ sintéticas no início).
 */
var COLUNAS_SINTETICAS_RECEBIMENTOS = [
  'numero_contrato'
];

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
  'st_sincro_sac',
  'st_splitdados_recb',
  'st_telefone_sac',
  'st_tidconciliacao_recb',
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
  'numero_contrato',
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

/**
 * Aba Contratos — taxa administrativa e contexto do contrato/imóvel.
 * Colunas sintéticas primeiro; depois campos brutos da API /contratos.
 *
 * numero_contrato = primeiros dígitos de st_identificador_imo
 * (ex.: "21 Rua das Laranjeiras 29 303" → "21").
 * Se começar com nome (sem número no início), fica vazio.
 */
var COLUNAS_SINTETICAS_CONTRATOS = [
  'numero_contrato',
  'id_contrato_con',
  'status_contrato_texto',
  'tx_adm_con',
  'tx_adm_tipo',           // Percentual | Valor fixo
  'tx_adm_estimativa_mes', // R$ estimado: % sobre aluguel OU valor fixo
  'vl_aluguel_con',
  'nome_proprietario',
  'st_identificador_imo'
];

var SCHEMA_CONTRATOS = [
  'fl_status_con',
  'fl_txadmvalorfixo_con',
  'fl_irdeduzirtxadm_con',
  'tx_adm_imovel',
  'fl_txadmvalorfixo_imovel',
  'tx_locacao_con',
  'dt_inicio_con',
  'dt_fim_con',
  'id_imovel_imo',
  'st_tipo_imo',
  'st_endereco_imo',
  'st_numero_imo',
  'st_complemento_imo',
  'st_bairro_imo',
  'st_cidade_imo',
  'st_estado_imo',
  'st_cep_imo',
  'id_sacado_sac',
  'id_administradora_adm',
  'st_nome_adm'
];

/** Colunas da aba Taxa Adm Realizada (repasses + composição/despesas). */
var COLUNAS_TAXA_ADM_REALIZADA = [
  'fonte',                 // repasse | composicao | despesa
  'numero_contrato',
  'id_contrato_con',
  'id_repasse_rep',
  'id_recebimento_recb',
  'proprietario',
  'st_identificador_imo',
  'tx_adm',
  'tx_adm_tipo',
  'vl_aluguel_base',
  'valor',                 // taxa adm do período (R$)
  'dt_repasse',
  'dt_pagamento',
  'dt_competencia',
  'dt_vencimento',
  'dt_liquidacao',
  'status_texto',
  'complemento'
];

// ---------------------------------------------------------------------------
// Menu / tokens
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Superlógica Analítico')
    .addItem('📥 Importar tudo', 'importarCobrancas')
    .addItem('📅 Importar por período', 'importarCobrancasPorPeriodo')
    .addItem('📋 Importar contratos (cadastro taxa)', 'importarContratos')
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

function extrairListaContratos_(payload) {
  // Mesmo envelope da API de cobranças: data: [ {...} ] ou data: [ [ {...} ] ]
  return extrairListaCobrancas_(payload);
}

function buscarPaginaContratos_(pagina) {
  var tokens = getTokens_();
  var url = CONFIG.API_CONTRATOS +
    '?itensPorPagina=' + CONFIG.ITENS_POR_PAGINA +
    '&pagina=' + pagina;

  if (CONFIG.COM_STATUS_CONTRATOS) {
    url += '&comStatus=' + encodeURIComponent(CONFIG.COM_STATUS_CONTRATOS);
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
    throw new Error('API contratos HTTP ' + code + ' (página ' + pagina + '): ' + text.substring(0, 400));
  }

  var payload = JSON.parse(text);
  if (payload && payload.status && Number(payload.status) >= 400) {
    throw new Error('API contratos status ' + payload.status + ': ' + (payload.msg || text.substring(0, 300)));
  }

  return extrairListaContratos_(payload);
}

function buscarTodosContratos_() {
  var todas = [];
  var pagina = 1;
  while (pagina <= 500) {
    var lote = buscarPaginaContratos_(pagina);
    if (!lote.length) break;
    todas = todas.concat(lote);
    Logger.log('Contratos página ' + pagina + ': ' + lote.length + ' | acumulado: ' + todas.length);
    if (lote.length < CONFIG.ITENS_POR_PAGINA) break;
    pagina++;
    Utilities.sleep(200);
  }
  return todas;
}

function buscarPaginaDespesas_(pagina, periodo) {
  var tokens = getTokens_();
  var url = CONFIG.API_DESPESAS +
    '?itensPorPagina=' + CONFIG.ITENS_POR_PAGINA +
    '&pagina=' + pagina;

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
    throw new Error('API despesas HTTP ' + code + ' (página ' + pagina + '): ' + text.substring(0, 400));
  }

  var payload = JSON.parse(text);
  if (payload && payload.status && Number(payload.status) >= 400) {
    throw new Error('API despesas status ' + payload.status + ': ' + (payload.msg || text.substring(0, 300)));
  }

  return extrairListaCobrancas_(payload);
}

function buscarTodasDespesas_(periodo) {
  var todas = [];
  var pagina = 1;
  while (pagina <= 500) {
    var lote = buscarPaginaDespesas_(pagina, periodo || null);
    if (!lote.length) break;
    todas = todas.concat(lote);
    Logger.log('Despesas página ' + pagina + ': ' + lote.length + ' | acumulado: ' + todas.length);
    if (lote.length < CONFIG.ITENS_POR_PAGINA) break;
    pagina++;
    Utilities.sleep(200);
  }
  return todas;
}

/**
 * Busca repasses de vários contratos em paralelo (fetchAll).
 * A listagem geral /repasses sem idContrato não retorna o histórico completo.
 */
function buscarRepassesDosContratos_(contratos) {
  var tokens = getTokens_();
  var ids = [];
  var seen = {};
  (contratos || []).forEach(function (c) {
    var id = (c && typeof c === 'object') ? c.id_contrato_con : c;
    if (id === null || id === undefined || id === '') return;
    id = String(id);
    if (seen[id]) return;
    seen[id] = true;
    ids.push(id);
  });

  var todas = [];
  var batch = CONFIG.REPASSES_BATCH_SIZE || 40;
  for (var i = 0; i < ids.length; i += batch) {
    var fatia = ids.slice(i, i + batch);
    var reqs = fatia.map(function (id) {
      return {
        url: CONFIG.API_REPASSES +
          '?itensPorPagina=100&idContrato=' + encodeURIComponent(id),
        method: 'get',
        headers: {
          accept: 'application/json',
          app_token: tokens.appToken,
          access_token: tokens.accessToken
        },
        muteHttpExceptions: true
      };
    });

    var resps = UrlFetchApp.fetchAll(reqs);
    for (var j = 0; j < resps.length; j++) {
      var code = resps[j].getResponseCode();
      if (code < 200 || code >= 300) {
        Logger.log('Repasse contrato ' + fatia[j] + ' HTTP ' + code);
        continue;
      }
      try {
        var payload = JSON.parse(resps[j].getContentText());
        todas = todas.concat(extrairListaCobrancas_(payload));
      } catch (e) {
        Logger.log('Repasse parse erro contrato ' + fatia[j] + ': ' + e);
      }
    }
    Logger.log('Repasses lote ' + (i / batch + 1) + ': acumulado ' + todas.length);
    Utilities.sleep(150);
  }
  return todas;
}

/**
 * Valor da taxa adm no repasse:
 * 1) vl_txadm_rep se preenchido
 * 2) valor fixo (fl_txadmvalorfixo_con=1) → tx_adm_con / tx_adm_rep
 * 3) percentual → aluguel × tx/100
 */
function valorTaxaAdmRepasse_(rep) {
  var vlApi = num_(rep.vl_txadm_rep);
  if (vlApi > 0) return vlApi;

  var tx = num_(rep.tx_adm_rep || rep.tx_adm_con);
  if (tx <= 0) return 0;

  var fixo = String(rep.fl_txadmvalorfixo_con) === '1' ||
    String(rep.fl_txadmfixa_rep) === '1';
  if (fixo) return tx;

  var aluguel = num_(rep.vl_aluguel_rep || rep.vl_aluguel_con);
  if (aluguel <= 0) return 0;
  return Math.round(aluguel * tx) / 100;
}

function nomeProprietarioRepasse_(rep) {
  var lista = rep.proprietarios_beneficiarios;
  if (Array.isArray(lista) && lista.length) {
    return lista[0].st_nome_pes || lista[0].st_fantasia_pes || '';
  }
  return rep.nome_proprietario || '';
}

function dataFiltroRepasse_(rep) {
  return parseDataApiField_(
    rep.dt_repasse_rep ||
    rep.dt_pagamento ||
    rep.dt_credito_recb ||
    rep.dt_liquidacao_recb
  );
}

function repasseNoPeriodo_(rep, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  var d = dataFiltroRepasse_(rep);
  if (!d) return false;
  var t = d.getTime();
  return t >= periodo.inicioDate.getTime() && t <= periodo.fimDate.getTime();
}

function statusRepasseTexto_(fl) {
  var mapa = {
    '0': 'Em aberto',
    '1': 'Liquidado',
    '2': 'Cancelado'
  };
  var key = String(fl === null || fl === undefined ? '' : fl);
  return mapa[key] || ('Status ' + key);
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
  // ISO: YYYY-MM-DD (despesas)
  var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  // API cobranças: MM/DD/YYYY ou MM/DD/YYYY HH:mm:ss
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

/**
 * Número do imóvel/contrato de negócio: dígitos no início de st_identificador_imo.
 * Ex.: "21 Rua das Laranjeiras 29 303" → "21"
 * Ex.: "010 Rua Sao Salvador 72" → "010"
 * Ex.: "Correa Dutra 55 404" → "" (começa com nome)
 */
function extrairNumeroIdentificadorImo_(identificador) {
  if (identificador === null || identificador === undefined || identificador === '') return '';
  var s = String(identificador).trim();
  // Remove hífen/espaço inicial residual, mas só aceita se o primeiro token for número
  // "352 -PRAIA..." → 352 | "- Conde..." → vazio | "Correa Dutra..." → vazio
  var m = s.match(/^(\d+)\b/);
  return m ? m[1] : '';
}

/** Produto "Taxa de administração" (e variantes). */
function ehProdutoTaxaAdm_(nome) {
  if (!nome) return false;
  var p = String(nome).toLowerCase();
  return p.indexOf(CONFIG.PRODUTO_TAXA_ADM) !== -1;
}

/**
 * Data de referência da despesa para filtro de período.
 * Preferência: competência → vencimento → liquidação → referência → lançamento.
 */
function dataFiltroDespesa_(despesa) {
  return parseDataApiField_(
    despesa.dt_competencia_imod ||
    despesa.competencia ||
    despesa.vencimento ||
    despesa.dt_liquidacao_mov ||
    despesa.dt_referencia_imod ||
    despesa.dt_lancamento_imod
  );
}

function despesaNoPeriodo_(despesa, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  var d = dataFiltroDespesa_(despesa);
  if (!d) return false;
  var t = d.getTime();
  return t >= periodo.inicioDate.getTime() && t <= periodo.fimDate.getTime();
}

/**
 * Monta linhas de Taxa Adm Realizada:
 * 1) REPASSES no período (fonte principal) — valor = vl_txadm_rep ou %×aluguel
 * 2) composição com produto "Taxa de administração"
 * 3) despesas com o mesmo produto
 */
function montarLinhasTaxaAdmRealizada_(cobrancas, despesas, repasses, periodo) {
  var rows = [];

  (repasses || []).forEach(function (rep) {
    if (!repasseNoPeriodo_(rep, periodo)) return;
    var valor = valorTaxaAdmRepasse_(rep);
    if (valor <= 0) return;

    var tx = num_(rep.tx_adm_rep || rep.tx_adm_con);
    var fixo = String(rep.fl_txadmvalorfixo_con) === '1' ||
      String(rep.fl_txadmfixa_rep) === '1';
    var aluguel = num_(rep.vl_aluguel_rep || rep.vl_aluguel_con);
    var ident = rep.st_identificador_imo || '';

    rows.push({
      fonte: 'repasse',
      numero_contrato: extrairNumeroIdentificadorImo_(ident),
      id_contrato_con: rep.id_contrato_con || '',
      id_repasse_rep: rep.id_repasse_rep || '',
      id_recebimento_recb: rep.id_recebimento_recb || '',
      proprietario: nomeProprietarioRepasse_(rep),
      st_identificador_imo: ident,
      tx_adm: tx,
      tx_adm_tipo: fixo ? 'Valor fixo' : 'Percentual',
      vl_aluguel_base: aluguel,
      valor: valor,
      dt_repasse: rep.dt_repasse_rep || '',
      dt_pagamento: rep.dt_pagamento || '',
      dt_competencia: rep.dt_competencia_recb || '',
      dt_vencimento: rep.dt_vencimento_recb || '',
      dt_liquidacao: rep.dt_liquidacao_recb || '',
      status_texto: statusRepasseTexto_(rep.fl_status_rep),
      complemento: 'Repasse ' + (nomeProprietarioRepasse_(rep) || '') +
        (ident ? ' - ' + ident : '')
    });
  });

  (cobrancas || []).forEach(function (item) {
    (item.compo_recebimento || []).forEach(function (c) {
      if (!ehProdutoTaxaAdm_(c.st_descricao_prd || c.st_descricao_comp)) return;
      rows.push({
        fonte: 'composicao',
        numero_contrato: extrairContrato_(item),
        id_contrato_con: extrairContrato_(item),
        id_repasse_rep: '',
        id_recebimento_recb: item.id_recebimento_recb || '',
        proprietario: item.st_nome_sac || '',
        st_identificador_imo: '',
        tx_adm: '',
        tx_adm_tipo: '',
        vl_aluguel_base: '',
        valor: num_(c.st_valor_comp),
        dt_repasse: '',
        dt_pagamento: '',
        dt_competencia: item.dt_competencia_recb || '',
        dt_vencimento: item.dt_vencimento_recb || '',
        dt_liquidacao: item.dt_liquidacao_recb || '',
        status_texto: statusTexto_(item.fl_status_recb),
        complemento: c.st_complemento_comp || c.st_descricao_prd || ''
      });
    });
  });

  (despesas || []).forEach(function (d) {
    if (!ehProdutoTaxaAdm_(d.st_descricao_prd)) return;
    if (!despesaNoPeriodo_(d, periodo)) return;
    var idCon = d.id_contrato_con || '';
    var ident = d.st_identificador_imo || '';
    rows.push({
      fonte: 'despesa',
      numero_contrato: extrairNumeroIdentificadorImo_(ident) || (idCon ? String(idCon) : ''),
      id_contrato_con: idCon,
      id_repasse_rep: d.id_repasse_rep || '',
      id_recebimento_recb: d.id_recebimento_recb || '',
      proprietario: d.nome_proprietariodebito || d.nome_proprietariocredito || '',
      st_identificador_imo: ident,
      tx_adm: '',
      tx_adm_tipo: '',
      vl_aluguel_base: '',
      valor: num_(d.vl_valor_imod),
      dt_repasse: '',
      dt_pagamento: '',
      dt_competencia: d.dt_competencia_imod || d.competencia || '',
      dt_vencimento: d.vencimento || '',
      dt_liquidacao: d.dt_liquidacao_mov || d.dt_liquidacao_imom || '',
      status_texto: String(d.fl_status_imod || ''),
      complemento: d.st_complemento_imod || d.st_descricao_prd || ''
    });
  });

  return rows;
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

function statusContratoTexto_(fl) {
  // fl_status_con: 0 ativo (em andamento), demais conforme ERP
  var mapa = {
    '0': 'Ativo',
    '1': 'Encerrado',
    '2': 'Rescindido',
    '3': 'Suspenso'
  };
  var key = String(fl === null || fl === undefined ? '' : fl);
  return mapa[key] || ('Status ' + key);
}

/** fl_txadmvalorfixo_con: 0 = percentual | 1 = valor fixo (R$) */
function txAdmTipo_(flFixo) {
  return String(flFixo) === '1' ? 'Valor fixo' : 'Percentual';
}

/**
 * Estimativa mensal da taxa adm:
 * - percentual: tx_adm_con% de vl_aluguel_con
 * - fixo: tx_adm_con em R$
 */
function txAdmEstimativaMes_(contrato) {
  var tx = num_(contrato.tx_adm_con);
  var aluguel = num_(contrato.vl_aluguel_con);
  if (String(contrato.fl_txadmvalorfixo_con) === '1') return tx;
  return aluguel * (tx / 100);
}

/**
 * API Superlógica envia datas em MM/DD/YYYY (às vezes com hora).
 * Na planilha gravamos DD/MM/YYYY.
 */
function formatarDataBr_(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    var d0 = valor.getDate();
    var m0 = valor.getMonth() + 1;
    var a0 = valor.getFullYear();
    return (d0 < 10 ? '0' : '') + d0 + '/' + (m0 < 10 ? '0' : '') + m0 + '/' + a0;
  }
  var s = String(valor).trim();
  var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?/);
  if (iso) {
    var anoI = Number(iso[1]);
    var mesI = Number(iso[2]);
    var diaI = Number(iso[3]);
    var horaI = iso[4] || '';
    var ddI = (diaI < 10 ? '0' : '') + diaI;
    var mmI = (mesI < 10 ? '0' : '') + mesI;
    return horaI ? (ddI + '/' + mmI + '/' + anoI + ' ' + horaI) : (ddI + '/' + mmI + '/' + anoI);
  }
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?$/);
  if (!m) return s;
  var mes = Number(m[1]);
  var dia = Number(m[2]);
  var ano = Number(m[3]);
  var hora = m[4] || '';
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return s;
  var dd = (dia < 10 ? '0' : '') + dia;
  var mm = (mes < 10 ? '0' : '') + mes;
  return hora ? (dd + '/' + mm + '/' + ano + ' ' + hora) : (dd + '/' + mm + '/' + ano);
}

function ehCampoData_(campo) {
  if (!campo) return false;
  var c = String(campo);
  return c.indexOf('dt_') === 0 || c === 'st_mesano_comp';
}

function celula_(valor, campo) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object') {
    if (Object.prototype.toString.call(valor) === '[object Date]') {
      return formatarDataBr_(valor);
    }
    try { return JSON.stringify(valor); } catch (e) { return String(valor); }
  }
  // Campos HTML: deixa legível na planilha
  if (campo === 'nome_formatado' || campo === 'st_marcador_calc') {
    return limparHtml_(valor);
  }
  if (campo === 'st_complementocomposicao_recb') {
    return String(valor).replace(/\r?\n/g, ' | ');
  }
  if (ehCampoData_(campo)) {
    return formatarDataBr_(valor);
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

/** Só a aba Contratos (taxa administrativa). */
function importarContratos() {
  var ui = SpreadsheetApp.getUi();
  var inicio = new Date();
  try {
    var contratos = buscarTodosContratos_();
    if (!contratos.length) {
      ui.alert('Nenhum contrato retornado pela API.');
      return;
    }
    var ss = getSs_();
    escreverContratos_(ss, contratos);
    escreverLog_(ss, contratos.length, inicio, null, 'Somente contratos (taxa adm)');
    ui.alert(
      '✅ Contratos importados!\n\n' +
      contratos.length + ' contrato(s)\n\n' +
      'Aba: ' + CONFIG.ABA_CONTRATOS
    );
  } catch (err) {
    Logger.log(err);
    try {
      escreverLog_(getSs_(), 0, inicio, String(err.message || err), 'Importar contratos');
    } catch (e2) {}
    ui.alert('⚠️ Erro:\n\n' + (err.message || err));
  }
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

    var contratos = [];
    try {
      contratos = buscarTodosContratos_();
      escreverContratos_(ss, contratos);
    } catch (errContratos) {
      Logger.log('Falha ao importar contratos (taxa adm): ' + errContratos);
    }

    // Se contratos falhar, usa ids das cobranças (contrato#N) para buscar repasses
    if (!contratos.length) {
      var idsMap = {};
      cobrancas.forEach(function (item) {
        var id = extrairContrato_(item);
        if (id) idsMap[id] = true;
      });
      contratos = Object.keys(idsMap).map(function (id) {
        return { id_contrato_con: id };
      });
    }

    var despesas = [];
    var repasses = [];
    var linhasTaxaAdm = [];
    try {
      if (contratos.length) {
        repasses = buscarRepassesDosContratos_(contratos);
      }
      try {
        despesas = buscarTodasDespesas_(periodo);
      } catch (errDesp) {
        Logger.log('Despesas (secundário) falhou: ' + errDesp);
      }
      linhasTaxaAdm = montarLinhasTaxaAdmRealizada_(cobrancas, despesas, repasses, periodo);
      escreverTaxaAdmRealizada_(ss, linhasTaxaAdm);
    } catch (errTaxa) {
      Logger.log('Falha ao montar Taxa Adm Realizada: ' + errTaxa);
      try {
        linhasTaxaAdm = montarLinhasTaxaAdmRealizada_(cobrancas, [], [], periodo);
        escreverTaxaAdmRealizada_(ss, linhasTaxaAdm);
      } catch (e2) {}
    }

    escreverResumo_(ss, cobrancas, contratos, linhasTaxaAdm);
    escreverLog_(
      ss,
      cobrancas.length,
      inicio,
      null,
      (periodo ? ('Período: ' + periodo.rotulo) : 'Importação completa (sem filtro de data)') +
      ' | Contratos: ' + contratos.length +
      ' | Repasses: ' + repasses.length +
      ' | Taxa adm realizada: ' + linhasTaxaAdm.length
    );

    ui.alert(
      '✅ Importação concluída!\n\n' +
      cobrancas.length + ' recebimento(s)\n' +
      contratos.length + ' contrato(s)\n' +
      linhasTaxaAdm.length + ' linha(s) Taxa Adm Realizada (repasses)\n' +
      (periodo ? 'Período: ' + periodo.rotulo + '\n\n' : '\n') +
      'Abas:\n' +
      '• ' + CONFIG.ABA_RECEBIMENTOS + '\n' +
      '• ' + CONFIG.ABA_COMPOSICAO + '\n' +
      '• ' + CONFIG.ABA_CONTRATOS + '\n' +
      '• ' + CONFIG.ABA_TAXA_ADM + '\n' +
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

/** Aba Recebimentos: número do contrato + propriedades escalares do schema. */
function escreverRecebimentosSchema_(ss, cobrancas) {
  var sh = ensureSheet_(ss, CONFIG.ABA_RECEBIMENTOS);

  // Remove aba antiga "Cobranças" se existir (versão anterior do script)
  var antiga = ss.getSheetByName('Cobranças');
  if (antiga && antiga.getName() !== CONFIG.ABA_RECEBIMENTOS) {
    try { ss.deleteSheet(antiga); } catch (e) { /* ignora se for a única aba */ }
  }
  var headers = COLUNAS_SINTETICAS_RECEBIMENTOS.concat(SCHEMA_COBRANCAS);

  var rows = cobrancas.map(function (item) {
    var sint = [extrairContrato_(item)];
    var schemaVals = SCHEMA_COBRANCAS.map(function (campo) {
      return celula_(item[campo], campo);
    });
    return sint.concat(schemaVals);
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
      formatarDataBr_(item.dt_competencia_recb),
      formatarDataBr_(item.dt_vencimento_recb),
      formatarDataBr_(item.dt_liquidacao_recb),
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

/**
 * Aba Contratos: 1 linha por contrato com taxa administrativa.
 * Fonte: GET /contratos (tx_adm_con + fl_txadmvalorfixo_con).
 */
function escreverContratos_(ss, contratos) {
  var sh = ensureSheet_(ss, CONFIG.ABA_CONTRATOS);
  var headers = COLUNAS_SINTETICAS_CONTRATOS.concat(SCHEMA_CONTRATOS);
  var rows = contratos.map(function (c) {
    var sint = [
      extrairNumeroIdentificadorImo_(c.st_identificador_imo),
      c.id_contrato_con || '',
      statusContratoTexto_(c.fl_status_con),
      num_(c.tx_adm_con),
      txAdmTipo_(c.fl_txadmvalorfixo_con),
      txAdmEstimativaMes_(c),
      num_(c.vl_aluguel_con),
      c.nome_proprietario || '',
      c.st_identificador_imo || ''
    ];
    var schemaVals = SCHEMA_CONTRATOS.map(function (campo) {
      return celula_(c[campo], campo);
    });
    return sint.concat(schemaVals);
  });

  escreverTabela_(sh, headers, rows);

  if (rows.length) {
    ['tx_adm_con', 'tx_adm_estimativa_mes', 'vl_aluguel_con', 'tx_adm_imovel', 'tx_locacao_con'].forEach(function (c) {
      var i = headers.indexOf(c);
      if (i >= 0) sh.getRange(2, i + 1, rows.length, 1).setNumberFormat('#,##0.00');
    });
  }
}

/**
 * Aba Taxa Adm Realizada: lançamentos explícitos "Taxa de administração"
 * vindos da composição das cobranças e das despesas no período.
 */
function escreverTaxaAdmRealizada_(ss, linhas) {
  var sh = ensureSheet_(ss, CONFIG.ABA_TAXA_ADM);
  var headers = COLUNAS_TAXA_ADM_REALIZADA.slice();
  var rows = (linhas || []).map(function (r) {
    return headers.map(function (campo) {
      var v = r[campo];
      if (ehCampoData_(campo) || campo.indexOf('dt_') === 0) {
        return formatarDataBr_(v);
      }
      if (campo === 'valor') return num_(v);
      return v === null || v === undefined ? '' : v;
    });
  });

  escreverTabela_(sh, headers, rows);

  if (rows.length) {
    ['valor', 'tx_adm', 'vl_aluguel_base'].forEach(function (c) {
      var i = headers.indexOf(c);
      if (i >= 0) sh.getRange(2, i + 1, rows.length, 1).setNumberFormat('#,##0.00');
    });
  }
}

function escreverResumo_(ss, cobrancas, contratos, linhasTaxaAdm) {
  var sh = ensureSheet_(ss, CONFIG.ABA_RESUMO);
  limparAba_(sh);

  contratos = contratos || [];
  linhasTaxaAdm = linhasTaxaAdm || [];

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

  var porTipoAdm = { 'Percentual': { qtd: 0, estimativa: 0 }, 'Valor fixo': { qtd: 0, estimativa: 0 } };
  var somaEstimativaAdm = 0;
  contratos.forEach(function (c) {
    var tipo = txAdmTipo_(c.fl_txadmvalorfixo_con);
    var est = txAdmEstimativaMes_(c);
    if (!porTipoAdm[tipo]) porTipoAdm[tipo] = { qtd: 0, estimativa: 0 };
    porTipoAdm[tipo].qtd++;
    porTipoAdm[tipo].estimativa += est;
    somaEstimativaAdm += est;
  });

  var porFonteTaxa = {};
  var somaTaxaRealizada = 0;
  linhasTaxaAdm.forEach(function (r) {
    var f = r.fonte || '(sem)';
    if (!porFonteTaxa[f]) porFonteTaxa[f] = { qtd: 0, total: 0 };
    porFonteTaxa[f].qtd++;
    porFonteTaxa[f].total += num_(r.valor);
    somaTaxaRealizada += num_(r.valor);
  });

  var out = [];
  out.push(['RESUMO ANALÍTICO — cobranças + taxa adm']);
  out.push(['Gerado em', new Date()]);
  out.push(['Total cobranças', cobrancas.length]);
  out.push(['Soma vl_total_recb', totalGeral]);
  out.push(['Total contratos', contratos.length]);
  out.push(['Soma estimativa taxa adm/mês (cadastro)', somaEstimativaAdm]);
  out.push(['Linhas Taxa de administração (realizada)', linhasTaxaAdm.length]);
  out.push(['Soma Taxa de administração (realizada)', somaTaxaRealizada]);
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
  out.push(['TAXA ADM CADASTRADA (aba Contratos)']);
  out.push(['tipo', 'qtd contratos', 'estimativa_mes_R$']);
  Object.keys(porTipoAdm).forEach(function (k) {
    out.push([k, porTipoAdm[k].qtd, porTipoAdm[k].estimativa]);
  });
  out.push([]);
  out.push(['TAXA ADM REALIZADA (aba Taxa Adm Realizada)']);
  out.push(['fonte', 'qtd', 'valor_R$']);
  Object.keys(porFonteTaxa).forEach(function (k) {
    out.push([k, porFonteTaxa[k].qtd, porFonteTaxa[k].total]);
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
