var CONFIG = {
  // Planilha CEMA analítico
  SPREADSHEET_ID: '1e9P89q-IEQylPMTjEI5UgtHXWrUI9q70-sC4oZAMgfk',
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
  // Conta categoria do relatório PDF "Movimentações de Taxa de administração"
  CONTA_CATEGORIA_TAXA_ADM: '1.1.1',
  // Fonte da Taxa Adm = SEMPRE API (/repasses). PDF só valida.
  // Ativos (/contratos ~304): jun/2026 ≈ 351. PDF ouro = 363.
  // Inativos (fl_ativo_con=0) não vêm em /contratos; entram via:
  //   (1) ids das cobranças do período (principal — cobre 117, 408, 509…)
  //   (2) /contratos?pesquisa={núm. ident} (gêmeos inativos; rede de segurança)
  // Com (1)+(2) jun/2026 ≈ 367 linhas (API; 4 acima do PDF — regra de data/valor).
  TAXA_ADM_FONTE_PDF: 'repasse',
  TAXA_ADM_INCLUIR_COMPOSICAO: false,
  TAXA_ADM_INCLUIR_DESPESAS: false,
  // false = ativos + ids das cobranças do período (inativos com boleto).
  TAXA_ADM_SOMENTE_CONTRATOS_ATIVOS: false,
  // true = também pesquisa gêmeos inativos por número do identificador.
  TAXA_ADM_PESQUISAR_CONTRATOS_INATIVOS: true,
  // Alvos jun/2026 (testados na API). PDF continua 363.
  TAXA_ADM_ALVO_LINHAS_ATIVOS_JUN2026: 351,
  TAXA_ADM_ALVO_LINHAS_API_JUN2026: 367,
  // Corte do período nos repasses (m/d/Y da API), nesta ordem / OR:
  // dt_credito_recb | dt_repasse_rep | dt_pagamento
  // API /repasses: máx. 50/página — paginar enquanto a página vier cheia.
  REPASSES_ITENS_POR_PAGINA: 50,
  // Lotes paralelos UrlFetchApp.fetchAll para /repasses?idContrato=
  REPASSES_BATCH_SIZE: 40,
  // Formato moeda pt-BR no Sheets (locale da planilha interpreta milhar/decimal)
  FORMATO_MOEDA_BR: '"R$"#,##0.00'
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
  'contrato_ativo',        // Ativo | Inativo (fl_ativo_con da API)
  'status_contrato_texto', // Em andamento / Encerrado… (fl_status_con)
  'tx_adm_con',
  'tx_adm_tipo',           // Percentual | Valor fixo
  'tx_adm_estimativa_mes', // R$ estimado: % sobre aluguel OU valor fixo
  'vl_aluguel_con',
  'nome_proprietario',
  'st_identificador_imo'
];

var SCHEMA_CONTRATOS = [
  'fl_ativo_con',
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
  'contrato_ativo',        // Ativo | Inativo (fl_ativo_con)
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
    .addItem('🧪 Testar datas Taxa Adm (API m/d/Y)', 'executarTestesDatasTaxaAdm')
    // .addItem('🧪 Validar fixture PDF ouro (363 / 84.509,30)', 'testarTaxaAdmPdfOuro')
    // .addItem('🔎 Comparar aba Taxa Adm × PDF ouro', 'compararTaxaAdmAbaComPdfOuro')
    .addToUi();

  // Menu 196A (CSV → Drive), se o arquivo extracao-contratos-196a.gs estiver no mesmo projeto
  if (typeof criarMenuAutomacoes196A_ === 'function') {
    criarMenuAutomacoes196A_();
  }
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

/** True se st_identificador_imo começa com o número do imóvel (ex. "434 …"). */
function identificadorComecaComNumero_(identificador, numero) {
  if (!numero) return false;
  var s = String(identificador || '').trim();
  var n = String(numero);
  return new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(s);
}

/**
 * /contratos?pesquisa=N — encontra contratos inativos (e ativos) pelo número do imóvel.
 * A listagem padrão de /contratos omite fl_ativo_con=0.
 */
function buscarContratosInativosPorPesquisa_(contratosBase) {
  var tokens = getTokens_();
  var idsJa = {};
  var numsMap = {};
  (contratosBase || []).forEach(function (c) {
    if (!c) return;
    if (c.id_contrato_con != null && c.id_contrato_con !== '') {
      idsJa[String(c.id_contrato_con)] = true;
    }
    var num = extrairNumeroIdentificadorImo_(c.st_identificador_imo);
    if (num) numsMap[num] = true;
  });
  var nums = Object.keys(numsMap);
  if (!nums.length) return [];

  var encontrados = [];
  var batch = CONFIG.REPASSES_BATCH_SIZE || 40;
  for (var i = 0; i < nums.length; i += batch) {
    var fatia = nums.slice(i, i + batch);
    var reqs = fatia.map(function (n) {
      return {
        url: CONFIG.API_CONTRATOS +
          '?itensPorPagina=20&pagina=1&pesquisa=' + encodeURIComponent(n),
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
      var num = fatia[j];
      if (resps[j].getResponseCode() < 200 || resps[j].getResponseCode() >= 300) continue;
      try {
        var lote = extrairListaContratos_(JSON.parse(resps[j].getContentText()));
        (lote || []).forEach(function (c) {
          if (!c || c.id_contrato_con == null || c.id_contrato_con === '') return;
          var id = String(c.id_contrato_con);
          if (idsJa[id]) return;
          if (!identificadorComecaComNumero_(c.st_identificador_imo, num)) return;
          idsJa[id] = true;
          encontrados.push(c);
        });
      } catch (e) {
        Logger.log('Pesquisa contrato ' + num + ': ' + e);
      }
    }
    Logger.log(
      'Pesquisa inativos lote ' + (i / batch + 1) +
      ': nums ' + fatia.length + ' | novos ' + encontrados.length
    );
    Utilities.sleep(120);
  }
  Logger.log('Contratos inativos via pesquisa: ' + encontrados.length);
  return encontrados;
}

/** Une listas de contratos por id_contrato_con (sem duplicar). */
function mesclarContratosPorId_(base, extras) {
  var out = (base || []).slice();
  var seen = {};
  out.forEach(function (c) {
    if (c && c.id_contrato_con != null && c.id_contrato_con !== '') {
      seen[String(c.id_contrato_con)] = true;
    }
  });
  (extras || []).forEach(function (c) {
    if (!c) return;
    var id = c.id_contrato_con != null ? String(c.id_contrato_con) : '';
    if (!id || seen[id]) return;
    seen[id] = true;
    out.push(c);
  });
  return out;
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
 * Busca despesas por contrato (fetchAll).
 * A listagem geral /despesas costuma voltar vazia ou incompleta sem id_contrato_con.
 */
function buscarDespesasDosContratos_(contratos, periodo) {
  var tokens = getTokens_();
  var ids = idsContratosUnicos_(contratos);
  var todas = [];
  var batch = CONFIG.REPASSES_BATCH_SIZE || 40;
  var qsPeriodo = '';
  if (periodo && periodo.inicioApi && periodo.fimApi) {
    qsPeriodo = '&dtInicio=' + encodeURIComponent(periodo.inicioApi) +
      '&dtFim=' + encodeURIComponent(periodo.fimApi);
  }

  for (var i = 0; i < ids.length; i += batch) {
    var fatia = ids.slice(i, i + batch);
    var reqs = fatia.map(function (id) {
      return {
        url: CONFIG.API_DESPESAS +
          '?itensPorPagina=100&pagina=1&id_contrato_con=' + encodeURIComponent(id) +
          qsPeriodo,
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
        Logger.log('Despesa contrato ' + fatia[j] + ' HTTP ' + code);
        continue;
      }
      try {
        var payload = JSON.parse(resps[j].getContentText());
        if (payload && payload.status && Number(payload.status) >= 400) {
          Logger.log('Despesa contrato ' + fatia[j] + ' status ' + payload.status);
          continue;
        }
        todas = todas.concat(extrairListaCobrancas_(payload));
      } catch (e) {
        Logger.log('Despesa parse erro contrato ' + fatia[j] + ': ' + e);
      }
    }
    Logger.log('Despesas/contrato lote ' + (i / batch + 1) + ': acumulado ' + todas.length);
    Utilities.sleep(150);
  }
  return todas;
}

/** Une listagem geral + por contrato e remove duplicatas. */
function buscarDespesasTaxaAdm_(contratos, periodo) {
  var mapa = {};
  var ordem = [];

  function addAll(lista) {
    (lista || []).forEach(function (d) {
      if (!d || typeof d !== 'object') return;
      var key = String(
        d.id_lancamento_imod ||
        d.id_despesa ||
        d.id_lancamento_imodm ||
        ''
      );
      if (!key) {
        key = [
          d.id_contrato_con || '',
          d.vencimento || '',
          d.vl_valor_imod || '',
          d.st_complemento_imod || '',
          d.st_descricao_prd || ''
        ].join('|');
      }
      if (mapa[key]) return;
      mapa[key] = d;
      ordem.push(d);
    });
  }

  try {
    addAll(buscarTodasDespesas_(periodo));
  } catch (e1) {
    Logger.log('Listagem geral despesas falhou: ' + e1);
  }

  // Sempre busca por contrato: a listagem geral costuma vir vazia/incompleta
  if (contratos && contratos.length) {
    try {
      addAll(buscarDespesasDosContratos_(contratos, periodo));
    } catch (e2) {
      Logger.log('Despesas por contrato falhou: ' + e2);
    }
  }

  Logger.log('Despesas unificadas: ' + ordem.length);
  return ordem;
}

function idsContratosUnicos_(contratos) {
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
  return ids;
}

/**
 * Busca repasses por contrato (fetchAll), com paginação.
 * A API limita a ~50 itens/página mesmo com itensPorPagina=100.
 * Sem paginar enquanto a página vier cheia, contratos antigos
 * perdem os créditos de junho (ficam na página 2+).
 */
function buscarRepassesDosContratos_(contratos, periodo) {
  var tokens = getTokens_();
  var ids = idsContratosUnicos_(contratos);
  var todas = [];
  var seen = {};
  var batch = CONFIG.REPASSES_BATCH_SIZE || 40;
  var pageSize = CONFIG.REPASSES_ITENS_POR_PAGINA || 50;
  // Não envia dtInicio/dtFim na URL: a API de repasses ignora/erra o filtro.
  // O recorte do período usa dt_credito_recb em m/d/Y (ver repasseNoPeriodoPdf_).

  function addUnique(lista) {
    (lista || []).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      // Chave estável: evita o mesmo repasse entrar 2x (paginação / lote)
      var key = r.id_repasse_rep != null && String(r.id_repasse_rep) !== ''
        ? 'id:' + String(r.id_repasse_rep)
        : [
          'f',
          r.id_contrato_con || '',
          r.id_recebimento_recb || '',
          r.dt_credito_recb || '',
          r.dt_repasse_rep || '',
          r.vl_txadm_rep || '',
          r.dt_vencimento_recb || ''
        ].join('|');
      if (seen[key]) return;
      seen[key] = true;
      todas.push(r);
    });
  }

  // Página 1 em lotes paralelos
  for (var i = 0; i < ids.length; i += batch) {
    var fatia = ids.slice(i, i + batch);
    var reqs = fatia.map(function (id) {
      return {
        url: CONFIG.API_REPASSES +
          '?itensPorPagina=' + pageSize + '&pagina=1&idContrato=' +
          encodeURIComponent(id),
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
    var precisaMaisPaginas = [];
    for (var j = 0; j < resps.length; j++) {
      var code = resps[j].getResponseCode();
      if (code < 200 || code >= 300) {
        Logger.log('Repasse contrato ' + fatia[j] + ' HTTP ' + code);
        continue;
      }
      try {
        var payload = JSON.parse(resps[j].getContentText());
        var lote = extrairListaCobrancas_(payload);
        addUnique(lote);
        if (lote.length >= pageSize) precisaMaisPaginas.push(fatia[j]);
      } catch (e) {
        Logger.log('Repasse parse erro contrato ' + fatia[j] + ': ' + e);
      }
    }
    Logger.log('Repasses lote ' + (i / batch + 1) + ': acumulado ' + todas.length);

    // Páginas 2+ só nos contratos que encheram a página
    for (var p = 0; p < precisaMaisPaginas.length; p++) {
      var idExtra = precisaMaisPaginas[p];
      for (var pagina = 2; pagina <= 60; pagina++) {
        var url = CONFIG.API_REPASSES +
          '?itensPorPagina=' + pageSize + '&pagina=' + pagina +
          '&idContrato=' + encodeURIComponent(idExtra);
        try {
          var resp = UrlFetchApp.fetch(url, {
            method: 'get',
            headers: {
              accept: 'application/json',
              app_token: tokens.appToken,
              access_token: tokens.accessToken
            },
            muteHttpExceptions: true
          });
          if (resp.getResponseCode() < 200 || resp.getResponseCode() >= 300) break;
          var lote2 = extrairListaCobrancas_(JSON.parse(resp.getContentText()));
          if (!lote2.length) break;
          addUnique(lote2);
          if (lote2.length < pageSize) break;
        } catch (e2) {
          break;
        }
        Utilities.sleep(80);
      }
    }
    Utilities.sleep(150);
  }

  Logger.log('Repasses unificados: ' + todas.length);
  return todas;
}

/** Soma vl_txadm_rei dos itens do repasse. */
function somaVlTxAdmItens_(rep) {
  var itens = rep && rep.repasse_item;
  if (!Array.isArray(itens) || !itens.length) return 0;
  var soma = 0;
  itens.forEach(function (it) {
    soma += num_(it.vl_txadm_rei);
  });
  return Math.round(soma * 100) / 100;
}

/**
 * Valor total da taxa adm no repasse:
 * 1) vl_txadm_rep
 * 2) soma vl_txadm_rei (itens)
 * 3) valor fixo / percentual sobre aluguel
 */
function valorTaxaAdmRepasse_(rep) {
  var vlApi = num_(rep.vl_txadm_rep);
  if (vlApi > 0) return vlApi;

  var somaItens = somaVlTxAdmItens_(rep);
  if (somaItens > 0) return somaItens;

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

/** Mapa id_pessoa → vl_txadm_rei (quando o rateio já vem no item do repasse). */
function mapaVlTxAdmPorPessoa_(rep) {
  var mapa = {};
  var itens = rep && rep.repasse_item;
  if (!Array.isArray(itens)) return mapa;
  itens.forEach(function (it) {
    var id = it && it.id_pessoa_pes != null ? String(it.id_pessoa_pes) : '';
    if (!id) return;
    var v = num_(it.vl_txadm_rei);
    if (v > 0) mapa[id] = v;
  });
  return mapa;
}

/**
 * Expande 1 repasse em N linhas (1 por proprietário/beneficiário),
 * como no PDF de movimentações — rateio por nm_fracao_prb ou vl_txadm_rei.
 */
function expandirLinhasTaxaAdmRepasse_(rep) {
  var valorTotal = valorTaxaAdmRepasse_(rep);
  if (valorTotal <= 0) return [];
  // cancelados fora
  if (String(rep.fl_status_rep) === '2') return [];

  var tx = num_(rep.tx_adm_rep || rep.tx_adm_con);
  var fixo = String(rep.fl_txadmvalorfixo_con) === '1' ||
    String(rep.fl_txadmfixa_rep) === '1';
  var aluguel = num_(rep.vl_aluguel_rep || rep.vl_aluguel_con);
  var ident = rep.st_identificador_imo || '';
  var numeroContrato = extrairNumeroIdentificadorImo_(ident) ||
    (rep.id_contrato_con != null ? String(rep.id_contrato_con) : '');

  var base = {
    fonte: 'repasse',
    numero_contrato: numeroContrato,
    id_contrato_con: rep.id_contrato_con || '',
    contrato_ativo: statusAtivoContratoTexto_(rep.fl_ativo_con),
    id_repasse_rep: rep.id_repasse_rep || '',
    id_recebimento_recb: rep.id_recebimento_recb || '',
    st_identificador_imo: ident,
    tx_adm: tx,
    tx_adm_tipo: fixo ? 'Valor fixo' : 'Percentual',
    vl_aluguel_base: aluguel,
    dt_repasse: rep.dt_repasse_rep || '',
    dt_pagamento: rep.dt_pagamento || '',
    dt_competencia: rep.dt_competencia_recb || '',
    dt_vencimento: rep.dt_vencimento_recb || '',
    dt_liquidacao: rep.dt_liquidacao_recb || '',
    status_texto: statusRepasseTexto_(rep.fl_status_rep)
  };

  var props = Array.isArray(rep.proprietarios_beneficiarios)
    ? rep.proprietarios_beneficiarios
    : [];
  if (!props.length) {
    var nomeUnico = nomeProprietarioRepasse_(rep) || '';
    return [mesclarObj_(base, {
      proprietario: nomeUnico,
      valor: valorTotal,
      complemento: 'Repasse ' + nomeUnico +
        (numeroContrato ? ' - Contrato ' + numeroContrato : '') +
        (ident ? ' ' + ident : '')
    })];
  }

  var mapaRei = mapaVlTxAdmPorPessoa_(rep);
  var temRei = Object.keys(mapaRei).length > 0;
  var fracoes = props.map(function (p) {
    return num_(p.nm_fracao_prb);
  });
  var somaFrac = fracoes.reduce(function (a, b) { return a + b; }, 0);
  var usarFrac = !temRei && somaFrac > 0;

  var linhas = [];
  var acumulado = 0;
  props.forEach(function (p, idx) {
    var nome = p.st_nome_pes || p.st_fantasia_pes || '';
    var idPes = p.id_pessoa_pes != null ? String(p.id_pessoa_pes) : '';
    var valorLinha = 0;

    if (temRei && idPes && mapaRei[idPes] > 0) {
      valorLinha = mapaRei[idPes];
    } else if (usarFrac) {
      if (idx === props.length - 1) {
        valorLinha = Math.round((valorTotal - acumulado) * 100) / 100;
      } else {
        valorLinha = Math.round(valorTotal * (fracoes[idx] / somaFrac) * 100) / 100;
        acumulado += valorLinha;
      }
    } else if (props.length === 1) {
      valorLinha = valorTotal;
    } else {
      // Sem fração/item: divide em partes iguais (último ajusta centavos)
      if (idx === props.length - 1) {
        valorLinha = Math.round((valorTotal - acumulado) * 100) / 100;
      } else {
        valorLinha = Math.round((valorTotal / props.length) * 100) / 100;
        acumulado += valorLinha;
      }
    }

    if (valorLinha <= 0) return;
    linhas.push(mesclarObj_(base, {
      proprietario: nome,
      valor: valorLinha,
      complemento: 'Repasse ' + nome +
        (numeroContrato ? ' - Contrato ' + numeroContrato : '') +
        (ident ? ' ' + ident : '')
    }));
  });

  return linhas;
}

function mesclarObj_(a, b) {
  var out = {};
  var k;
  for (k in a) {
    if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
  }
  for (k in b) {
    if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k];
  }
  return out;
}

function dataFiltroRepasse_(rep) {
  return parseDataApiField_(
    rep.dt_credito_recb ||
    rep.dt_vencimento_recb ||
    rep.dt_pagamento ||
    rep.dt_repasse_rep ||
    rep.dt_liquidacao_recb ||
    rep.dt_competencia_recb,
    false
  );
}

/**
 * Data do crédito da taxa no PDF ≈ dt_credito_recb do repasse.
 * A API Superlógica devolve datas em m/d/Y — NÃO usar parse BR flex aqui:
 * "03/06/2026" (6 mar) virava 3 jun e inflava o mês.
 */
function camposDataRepassePdf_(rep) {
  return [rep.dt_credito_recb];
}

/**
 * True se dt_credito_recb (m/d/Y da API) cair no período.
 * Fallback: dt_repasse_rep / dt_pagamento no mesmo formato.
 */
function repasseNoPeriodoPdf_(rep, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  var campos = [
    rep.dt_credito_recb,
    rep.dt_repasse_rep,
    rep.dt_pagamento
  ];
  for (var i = 0; i < campos.length; i++) {
    if (dataValorNoPeriodoApiUs_(campos[i], periodo)) return true;
  }
  return false;
}

/** Período com data da API em m/d/Y (preferBr=false). */
function dataValorNoPeriodoApiUs_(valorData, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  if (valorData === null || valorData === undefined || valorData === '') return false;
  var d = parseDataApiField_(valorData, false);
  if (!d) return false;
  var t = d.getTime();
  return t >= periodo.inicioDate.getTime() && t <= periodo.fimDate.getTime();
}

function repasseNoPeriodo_(rep, periodo) {
  return repasseNoPeriodoPdf_(rep, periodo);
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

/**
 * Parse de data da API.
 * - ISO: YYYY-MM-DD
 * - Cobranças: costuma MM/DD/YYYY
 * - Despesas: schema em dd/mm/aaaa — por isso há desambiguação
 * preferBr=true → interpreta barra como DD/MM/YYYY quando ambíguo
 */
function parseDataApiField_(valor, preferBr) {
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
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  var a = Number(m[1]);
  var b = Number(m[2]);
  var ano = Number(m[3]);
  var dia;
  var mes;
  if (a > 12 && b <= 12) {
    // DD/MM/YYYY
    dia = a; mes = b;
  } else if (b > 12 && a <= 12) {
    // MM/DD/YYYY
    mes = a; dia = b;
  } else if (preferBr) {
    dia = a; mes = b;
  } else {
    // padrão cobranças Superlógica
    mes = a; dia = b;
  }
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  var d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return d;
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
  var id = String(CONFIG.SPREADSHEET_ID || '').trim();
  var placeholder = !id || /^X+$/i.test(id) || id.indexOf('XXXX') === 0;
  if (!placeholder) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      Logger.log('openById falhou, usando planilha ativa: ' + e);
    }
  }
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (ativa) return ativa;
  throw new Error(
    'SPREADSHEET_ID inválido e não há planilha ativa. ' +
    'Defina CONFIG.SPREADSHEET_ID ou rode o script a partir da planilha.'
  );
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
  if (p.indexOf(CONFIG.PRODUTO_TAXA_ADM) !== -1) return true;
  // taxa adm / taxa administrativa / tx adm
  return /taxa\s*(de\s*)?admin/.test(p) || /tx\s*adm/.test(p);
}

/** Extrai "Contrato N" do complemento do PDF/despesa. */
function extrairContratoDoComplemento_(texto) {
  var m = String(texto || '').match(/Contrato\s+(\d+)/i);
  return m ? m[1] : '';
}

/** Extrai nome após "Repasse ..." no complemento. */
function extrairNomeRepasseComplemento_(texto) {
  var m = String(texto || '').match(/^Repasse\s+(.+?)\s+-\s+Contrato/i);
  return m ? String(m[1]).trim() : '';
}

/**
 * Despesa que entra no relatório de movimentações de taxa adm (PDF).
 * Aceita: produto taxa adm, conta 1.1.1, ou complemento "Repasse … Contrato".
 */
function ehDespesaTaxaAdmPdf_(despesa) {
  if (!despesa) return false;
  if (ehProdutoTaxaAdm_(despesa.st_descricao_prd)) return true;
  if (ehProdutoTaxaAdm_(despesa.st_complemento_imod)) return true;
  if (ehProdutoTaxaAdm_(despesa.st_label_imod)) return true;
  var conta = String(despesa.st_conta_cont || '').replace(/\s/g, '');
  var cat = String(CONFIG.CONTA_CATEGORIA_TAXA_ADM || '1.1.1').replace(/\s/g, '');
  var comp = String(despesa.st_complemento_imod || '');
  if (cat && conta.indexOf(cat) !== -1) return true;
  // Formato típico do PDF de movimentações
  if (/^Repasse\s+/i.test(comp) && /Contrato\s+\d+/i.test(comp)) return true;
  // Alguns retornos trazem só "Taxa" no complemento
  if (/taxa/i.test(comp) && /admin|adm/i.test(comp)) return true;
  return false;
}

/** Valor da despesa (aceita campos alternativos; usa módulo se vier negativo). */
function valorDespesaTaxa_(despesa) {
  if (!despesa) return 0;
  var v = num_(despesa.vl_valor_imod);
  if (!v) v = num_(despesa.vl_valor);
  if (!v) v = num_(despesa.st_valor_imod);
  if (!v) v = num_(despesa.vl_total_imod);
  return Math.abs(v);
}

/**
 * Campos de data da despesa (ordem do PDF: crédito/vencimento primeiro).
 */
function camposDataDespesaPdf_(despesa) {
  return [
    despesa.vencimento,
    despesa.dt_liquidacao_mov,
    despesa.dt_lancamento_imod,
    despesa.dt_referencia_imod,
    despesa.dt_competencia_imod,
    despesa.competencia,
    despesa.dt_liquidacao_imom
  ];
}

/**
 * True se ALGUEMA interpretação da data (dd/mm OU mm/dd OU ISO) cair no período.
 * Necessário porque a API mistura formatos entre endpoints.
 */
function dataValorNoPeriodoFlex_(valorData, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  if (valorData === null || valorData === undefined || valorData === '') return false;
  var ini = periodo.inicioDate.getTime();
  var fim = periodo.fimDate.getTime();
  var vistos = {};
  var opcoes = [
    parseDataApiField_(valorData, true),
    parseDataApiField_(valorData, false)
  ];
  for (var i = 0; i < opcoes.length; i++) {
    var d = opcoes[i];
    if (!d) continue;
    var t = d.getTime();
    if (vistos[t]) continue;
    vistos[t] = true;
    if (t >= ini && t <= fim) return true;
  }
  return false;
}

function despesaTaxaAdmNoPeriodoPdf_(despesa, periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return true;
  var campos = camposDataDespesaPdf_(despesa);
  for (var i = 0; i < campos.length; i++) {
    if (dataValorNoPeriodoFlex_(campos[i], periodo)) return true;
  }
  return false;
}

function dataFiltroDespesa_(despesa) {
  var campos = [
    despesa.dt_competencia_imod,
    despesa.competencia,
    despesa.vencimento,
    despesa.dt_liquidacao_mov,
    despesa.dt_referencia_imod,
    despesa.dt_lancamento_imod
  ];
  for (var i = 0; i < campos.length; i++) {
    var dBr = parseDataApiField_(campos[i], true);
    if (dBr) return dBr;
    var dUs = parseDataApiField_(campos[i], false);
    if (dUs) return dUs;
  }
  return null;
}

function despesaNoPeriodo_(despesa, periodo) {
  return despesaTaxaAdmNoPeriodoPdf_(despesa, periodo);
}

/**
 * Diagnóstico: por que as 1533 despesas não viram linha de taxa adm.
 */
function diagnosticarDespesasTaxaAdm_(despesas, periodo) {
  var tot = (despesas || []).length;
  var matchTipo = 0;
  var matchPeriodo = 0;
  var matchValor = 0;
  var passariam = 0;
  var somaPassariam = 0;
  var prods = {};
  var contas = {};
  var amostras = [];

  (despesas || []).forEach(function (d) {
    var p = String(d.st_descricao_prd || '(vazio)');
    prods[p] = (prods[p] || 0) + 1;
    var c = String(d.st_conta_cont || '(vazio)');
    contas[c] = (contas[c] || 0) + 1;

    var tipo = ehDespesaTaxaAdmPdf_(d);
    if (tipo) matchTipo++;
    var per = despesaTaxaAdmNoPeriodoPdf_(d, periodo);
    if (tipo && per) matchPeriodo++;
    var valor = valorDespesaTaxa_(d);
    if (tipo && per && valor > 0) {
      matchValor++;
      passariam++;
      somaPassariam += valor;
      if (amostras.length < 5) {
        amostras.push(
          (d.vencimento || d.dt_competencia_imod || '?') +
          ' | R$ ' + valor +
          ' | ' + p.substring(0, 40) +
          ' | ' + String(d.st_complemento_imod || '').substring(0, 50)
        );
      }
    }
  });

  function topN(mapa, n) {
    return Object.keys(mapa).sort(function (a, b) {
      return mapa[b] - mapa[a];
    }).slice(0, n).map(function (k) {
      return mapa[k] + '× ' + k.substring(0, 50);
    });
  }

  return {
    total: tot,
    matchTipo: matchTipo,
    matchPeriodo: matchPeriodo,
    passariam: passariam,
    somaPassariam: somaPassariam,
    topProdutos: topN(prods, 8),
    topContas: topN(contas, 6),
    amostras: amostras
  };
}

/**
 * Monta linhas de Taxa Adm Realizada para conferir com o PDF.
 * Fonte principal: REPASSE (rateio por proprietário) — igual ao relatório
 * "Movimentações de Taxa de administração".
 * /despesas NÃO é a fonte do PDF (lá vêm condomínio/IPTU conta 3.x).
 */
function montarLinhasTaxaAdmRealizada_(cobrancas, despesas, repasses, periodo, contratos) {
  var rows = [];
  // IMPORTANTE: usar === true (não !== false). Com !== false, qualquer valor
  // truthy/ausente ligava composição e DUPLICAVA a taxa junto com o repasse.
  var incluirComposicao = CONFIG.TAXA_ADM_INCLUIR_COMPOSICAO === true;
  var incluirDespesas = CONFIG.TAXA_ADM_INCLUIR_DESPESAS === true;
  var vistosLinha = {};
  var mapaAtivo = mapaContratoAtivoTexto_(contratos);

  function comAtivo_(linha) {
    var id = linha.id_contrato_con != null ? String(linha.id_contrato_con) : '';
    var doRep = linha.contrato_ativo || '';
    linha.contrato_ativo = doRep || (id && mapaAtivo[id]) || '';
    return linha;
  }

  // 1) REPASSES no período (fonte do PDF)
  (repasses || []).forEach(function (rep) {
    if (!repasseNoPeriodoPdf_(rep, periodo)) return;
    var expandidas = expandirLinhasTaxaAdmRepasse_(rep);
    for (var i = 0; i < expandidas.length; i++) {
      var linha = comAtivo_(expandidas[i]);
      // Dedupa: mesmo repasse + mesmo proprietário não entra 2x
      var chave = [
        linha.id_repasse_rep || '',
        linha.id_recebimento_recb || '',
        linha.numero_contrato || '',
        linha.proprietario || '',
        linha.valor
      ].join('|');
      if (vistosLinha[chave]) continue;
      vistosLinha[chave] = true;
      rows.push(linha);
    }
  });

  // 2) Composição (opcional)
  if (incluirComposicao) {
    (cobrancas || []).forEach(function (item) {
      if (periodo) {
        var okCob =
          dataValorNoPeriodoFlex_(item.dt_vencimento_recb, periodo) ||
          dataValorNoPeriodoFlex_(item.dt_liquidacao_recb, periodo) ||
          dataValorNoPeriodoFlex_(item.dt_credito_recb, periodo) ||
          dataValorNoPeriodoFlex_(item.dt_competencia_recb, periodo);
        if (!okCob) return;
      }
      (item.compo_recebimento || []).forEach(function (c) {
        if (!ehProdutoTaxaAdm_(c.st_descricao_prd || c.st_descricao_comp)) return;
        var valor = num_(c.st_valor_comp);
        if (valor <= 0) return;
        rows.push(comAtivo_({
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
          valor: valor,
          dt_repasse: '',
          dt_pagamento: '',
          dt_competencia: item.dt_competencia_recb || '',
          dt_vencimento: item.dt_vencimento_recb || '',
          dt_liquidacao: item.dt_liquidacao_recb || '',
          status_texto: statusTexto_(item.fl_status_recb),
          complemento: c.st_complemento_comp || c.st_descricao_prd || ''
        }));
      });
    });
  }

  // 3) Despesas — desligado por padrão (não é o PDF de taxa adm)
  if (incluirDespesas) {
    (despesas || []).forEach(function (d) {
      if (!ehDespesaTaxaAdmPdf_(d)) return;
      if (!despesaTaxaAdmNoPeriodoPdf_(d, periodo)) return;
      var valor = valorDespesaTaxa_(d);
      if (valor <= 0) return;
      var complemento = d.st_complemento_imod || d.st_descricao_prd || '';
      var idCon = d.id_contrato_con || '';
      var ident = d.st_identificador_imo || '';
      rows.push(comAtivo_({
        fonte: 'despesa',
        numero_contrato: extrairContratoDoComplemento_(complemento) ||
          extrairNumeroIdentificadorImo_(ident) ||
          (idCon ? String(idCon) : ''),
        id_contrato_con: idCon,
        id_repasse_rep: d.id_repasse_rep || '',
        id_recebimento_recb: d.id_recebimento_recb || '',
        proprietario: extrairNomeRepasseComplemento_(complemento) ||
          d.nome_proprietariodebito ||
          d.nome_proprietariocredito ||
          '',
        st_identificador_imo: ident,
        tx_adm: '',
        tx_adm_tipo: '',
        vl_aluguel_base: '',
        valor: valor,
        dt_repasse: '',
        dt_pagamento: '',
        dt_competencia: d.dt_competencia_imod || d.competencia || '',
        dt_vencimento: d.vencimento || '',
        dt_liquidacao: d.dt_liquidacao_mov || d.dt_liquidacao_imom || '',
        status_texto: String(d.fl_status_imod || ''),
        complemento: complemento
      }));
    });
  }

  Logger.log('Taxa Adm montada: ' + rows.length + ' linha(s)');
  return rows;
}

/** Diagnóstico dos repasses vs meta do PDF (363 / 84.509,30). */
function diagnosticarRepassesTaxaAdm_(repasses, periodo) {
  var tot = (repasses || []).length;
  var cancelados = 0;
  var noPeriodo = 0;
  var comValor = 0;
  var linhas = 0;
  var soma = 0;
  var semData = 0;
  var foraPeriodo = 0;
  var valorZero = 0;

  (repasses || []).forEach(function (rep) {
    if (String(rep.fl_status_rep) === '2') {
      cancelados++;
      return;
    }
    if (!rep.dt_credito_recb && !rep.dt_repasse_rep && !rep.dt_pagamento) {
      semData++;
    }
    if (!repasseNoPeriodoPdf_(rep, periodo)) {
      foraPeriodo++;
      return;
    }
    noPeriodo++;
    var exp = expandirLinhasTaxaAdmRepasse_(rep);
    if (!exp.length) {
      valorZero++;
      return;
    }
    comValor++;
    exp.forEach(function (r) {
      linhas++;
      soma += num_(r.valor);
    });
  });

  return {
    total: tot,
    cancelados: cancelados,
    semData: semData,
    foraPeriodo: foraPeriodo,
    noPeriodo: noPeriodo,
    comValor: comValor,
    valorZero: valorZero,
    linhas: linhas,
    soma: Math.round(soma * 100) / 100,
    alvoLinhas: 363,
    alvoSoma: 84509.30
  };
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
  // fl_status_con: 0 em andamento, demais conforme ERP
  var mapa = {
    '0': 'Em andamento',
    '1': 'Encerrado',
    '2': 'Rescindido',
    '3': 'Suspenso'
  };
  var key = String(fl === null || fl === undefined ? '' : fl);
  return mapa[key] || ('Status ' + key);
}

/**
 * fl_ativo_con da API: 1 = listado em /contratos (ativo), 0 = inativo
 * (só aparece via pesquisa / cobrança).
 */
function statusAtivoContratoTexto_(fl) {
  if (fl === null || fl === undefined || fl === '') return '';
  return String(fl) === '0' ? 'Inativo' : 'Ativo';
}

/** Mapa id_contrato_con → "Ativo" | "Inativo". */
function mapaContratoAtivoTexto_(contratos) {
  var mapa = {};
  (contratos || []).forEach(function (c) {
    if (!c || c.id_contrato_con == null || c.id_contrato_con === '') return;
    var id = String(c.id_contrato_con);
    var txt = statusAtivoContratoTexto_(c.fl_ativo_con);
    if (txt) mapa[id] = txt;
  });
  return mapa;
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

/**
 * Converte valor numérico da API.
 * Aceita number, "1234.56", "1234,56" e "1.234,56" (pt-BR).
 */
function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim().replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!s) return 0;
  // pt-BR: 1.234,56 ou 1234,56
  if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s) || (/^-?\d+,\d+$/.test(s) && s.indexOf('.') < 0)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
    // se ambos, assume . milhar e , decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.indexOf(',') >= 0) {
    s = s.replace(',', '.');
  }
  var n = Number(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Campos de valor em moeda (R$).
 * Não inclui taxas percentuais (tx_adm_con, tx_adm, tx_locacao_con, etc.).
 */
function ehCampoMoeda_(campo) {
  if (!campo) return false;
  var c = String(campo).toLowerCase();
  if (c === 'valor' || c === 'valor_sintetico') return true;
  if (c === 'st_valor_comp' || c === 'tx_adm_estimativa_mes') return true;
  if (c === 'tx_bancaria') return true;
  if (c.indexOf('vl_') === 0) return true;
  if (c.indexOf('valor') !== -1 && c.indexOf('fixo') === -1) return true;
  return false;
}

function formatoMoedaBr_() {
  return CONFIG.FORMATO_MOEDA_BR || '"R$"#,##0.00';
}

/** Aplica R$ pt-BR nas colunas monetárias da tabela (a partir da linha 2). */
function aplicarFormatoMoedaColunas_(sh, headers, numRows, campos) {
  if (!sh || !headers || !headers.length || !numRows) return;
  var lista = campos && campos.length
    ? campos
    : headers.filter(function (h) { return ehCampoMoeda_(h); });
  var fmt = formatoMoedaBr_();
  lista.forEach(function (c) {
    var i = headers.indexOf(c);
    if (i >= 0) sh.getRange(2, i + 1, numRows, 1).setNumberFormat(fmt);
  });
}

/**
 * Aplica layout visual do Resumo Analítico a partir de meta por linha.
 * meta[i].kind: title | section | note | header | kpi | data | total | blank | accent_ativo | accent_inativo | gap_pos | gap_neg
 * meta[i].moneyCols: índices 0-based das colunas em R$
 */
function formatarAbaResumoAnalitico_(sh, out, meta, maxCols) {
  if (!sh || !out || !out.length) return;
  var fmt = formatoMoedaBr_();
  var C = {
    titleBg: '#1b4332',
    titleFg: '#ffffff',
    sectionBg: '#2d6a4f',
    sectionFg: '#ffffff',
    headerBg: '#d8f3dc',
    headerFg: '#1b4332',
    kpiBg: '#f8faf9',
    kpiLabelFg: '#40916c',
    totalBg: '#e9f5ee',
    noteFg: '#52796f',
    zebra: '#f7fbf8',
    ativoBg: '#d8f3dc',
    inativoBg: '#fff3e6',
    border: '#95d5b2'
  };

  sh.setFrozenRows(1);
  sh.getRange(1, 1, out.length, maxCols)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setVerticalAlignment('middle');

  for (var r = 0; r < out.length; r++) {
    var kind = (meta && meta[r] && meta[r].kind) || 'data';
    var moneyCols = (meta && meta[r] && meta[r].moneyCols) || [];
    var range = sh.getRange(r + 1, 1, 1, maxCols);
    var row = out[r] || [];

    if (kind === 'title') {
      range.merge()
        .setFontWeight('bold')
        .setFontSize(14)
        .setBackground(C.titleBg)
        .setFontColor(C.titleFg)
        .setHorizontalAlignment('left');
      sh.setRowHeight(r + 1, 32);
    } else if (kind === 'section') {
      range.merge()
        .setFontWeight('bold')
        .setFontSize(11)
        .setBackground(C.sectionBg)
        .setFontColor(C.sectionFg);
      sh.setRowHeight(r + 1, 24);
    } else if (kind === 'note') {
      range.merge()
        .setFontStyle('italic')
        .setFontSize(9)
        .setFontColor(C.noteFg)
        .setBackground('#ffffff');
    } else if (kind === 'header') {
      range.setFontWeight('bold')
        .setBackground(C.headerBg)
        .setFontColor(C.headerFg)
        .setHorizontalAlignment('center');
      sh.getRange(r + 1, 1).setHorizontalAlignment('left');
    } else if (kind === 'kpi') {
      sh.getRange(r + 1, 1)
        .setFontWeight('bold')
        .setFontColor(C.kpiLabelFg)
        .setBackground(C.kpiBg);
      sh.getRange(r + 1, 2, 1, maxCols - 1)
        .setBackground(C.kpiBg)
        .setFontWeight('bold');
    } else if (kind === 'total') {
      range.setFontWeight('bold').setBackground(C.totalBg);
    } else if (kind === 'accent_ativo') {
      range.setBackground(C.ativoBg);
    } else if (kind === 'accent_inativo') {
      range.setBackground(C.inativoBg);
    } else if (kind === 'blank') {
      sh.setRowHeight(r + 1, 10);
    } else if (kind === 'data') {
      // zebra só em linhas de dados (ignora título/seção/blank)
      var dataIdx = 0;
      for (var j = 0; j <= r; j++) {
        if (((meta && meta[j] && meta[j].kind) || 'data') === 'data') dataIdx++;
      }
      if (dataIdx % 2 === 0) range.setBackground(C.zebra);
    } else if (kind === 'gap_pos') {
      range.setBackground('#d8f3dc').setFontWeight('bold');
    } else if (kind === 'gap_neg') {
      range.setBackground('#fde2e1').setFontWeight('bold');
    }

    // Alinha números à direita
    for (var c = 1; c < row.length; c++) {
      if (typeof row[c] === 'number') {
        sh.getRange(r + 1, c + 1).setHorizontalAlignment('right');
      }
    }
    moneyCols.forEach(function (ci) {
      if (ci >= 0 && ci < maxCols) {
        sh.getRange(r + 1, ci + 1).setNumberFormat(fmt);
      }
    });
  }

  // Larguras úteis (evita autoResize bagunçado em rótulos longos)
  sh.setColumnWidth(1, 280);
  sh.setColumnWidth(2, 160);
  sh.setColumnWidth(3, 160);
  sh.setColumnWidth(4, 150);
  if (maxCols > 4) {
    for (var w = 5; w <= maxCols; w++) sh.setColumnWidth(w, 120);
  }
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

/**
 * True se o período pedido é exatamente junho/2026 (relatório PDF de referência).
 */
function periodoEhJunho2026_(periodo) {
  if (!periodo || !periodo.inicioDate || !periodo.fimDate) return false;
  var i = periodo.inicioDate;
  var f = periodo.fimDate;
  return i.getFullYear() === 2026 && i.getMonth() === 5 && i.getDate() === 1 &&
    f.getFullYear() === 2026 && f.getMonth() === 5 && f.getDate() === 30;
}

/**
 * Fixture ouro do PDF (só para comparar — NÃO é fonte de dados).
 * Exige taxa-adm-pdf-junho-2026-dados.gs no projeto Apps Script.
 */
function linhasTaxaAdmDoPdfOuro_() {
  if (typeof TAXA_ADM_PDF_JUNHO_2026 === 'undefined' || !TAXA_ADM_PDF_JUNHO_2026) {
    throw new Error(
      'Arquivo taxa-adm-pdf-junho-2026-dados.gs não encontrado no Apps Script.\n' +
      'Cole esse arquivo junto com o script principal (apenas para validação).'
    );
  }
  return TAXA_ADM_PDF_JUNHO_2026.map(function (r) {
    return mesclarObj_(r, {});
  });
}

/** Valida a fixture do PDF: 363 linhas e soma 84509.30 */
function testarTaxaAdmPdfOuro() {
  var ui = SpreadsheetApp.getUi();
  try {
    var linhas = linhasTaxaAdmDoPdfOuro_();
    var soma = 0;
    linhas.forEach(function (r) { soma += num_(r.valor); });
    soma = Math.round(soma * 100) / 100;
    var meta = metaTaxaAdmPdfJunho2026_();
    var okQtd = linhas.length === meta.quantidade;
    var okSoma = Math.abs(soma - meta.soma) < 0.01;
    var msg =
      'FIXTURE PDF (docs/pdf/taxa-adm-cema-junho.pdf)\n' +
      'Só para comparação — a aba deve vir da API.\n\n' +
      'Quantidade: ' + linhas.length + ' (alvo ' + meta.quantidade + ') ' +
      (okQtd ? '✅' : '❌') + '\n' +
      'Soma: R$ ' + soma.toFixed(2).replace('.', ',') +
      ' (alvo ' + String(meta.soma).replace('.', ',') + ') ' +
      (okSoma ? '✅' : '❌');
    Logger.log(msg);
    ui.alert(msg);
    return { ok: okQtd && okSoma, quantidade: linhas.length, soma: soma };
  } catch (err) {
    ui.alert('⚠️ ' + (err.message || err));
    return { ok: false, erro: String(err.message || err) };
  }
}

/**
 * Compara a aba Taxa Adm Realizada (API) com o PDF ouro jun/2026.
 */
function compararTaxaAdmAbaComPdfOuro() {
  var ui = SpreadsheetApp.getUi();
  try {
    var ouro = linhasTaxaAdmDoPdfOuro_();
    var meta = metaTaxaAdmPdfJunho2026_();
    var ss = getSs_();
    var sh = ss.getSheetByName(CONFIG.ABA_TAXA_ADM);
    if (!sh || sh.getLastRow() < 2) {
      throw new Error('Aba "' + CONFIG.ABA_TAXA_ADM + '" vazia. Importe pela API primeiro.');
    }
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var idxValor = -1;
    var idxContrato = -1;
    var idxProp = -1;
    for (var h = 0; h < headers.length; h++) {
      var name = String(headers[h] || '').toLowerCase();
      if (name === 'valor') idxValor = h;
      if (name === 'numero_contrato') idxContrato = h;
      if (name === 'proprietario') idxProp = h;
    }
    if (idxValor < 0) throw new Error('Coluna valor não encontrada na aba.');

    var values = sh.getRange(2, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
    var somaApi = 0;
    var qtdApi = 0;
    var chaveApi = {};
    values.forEach(function (row) {
      var v = num_(row[idxValor]);
      if (v <= 0) return;
      qtdApi++;
      somaApi += v;
      var k = [
        idxContrato >= 0 ? String(row[idxContrato] || '') : '',
        idxProp >= 0 ? String(row[idxProp] || '').toUpperCase() : '',
        v.toFixed(2)
      ].join('|');
      chaveApi[k] = (chaveApi[k] || 0) + 1;
    });
    somaApi = Math.round(somaApi * 100) / 100;

    var chaveOuro = {};
    ouro.forEach(function (r) {
      var k = [
        String(r.numero_contrato || ''),
        String(r.proprietario || '').toUpperCase(),
        num_(r.valor).toFixed(2)
      ].join('|');
      chaveOuro[k] = (chaveOuro[k] || 0) + 1;
    });

    var soPdf = 0;
    var soApi = 0;
    var keys = {};
    Object.keys(chaveOuro).forEach(function (k) { keys[k] = true; });
    Object.keys(chaveApi).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (k) {
      var dO = (chaveOuro[k] || 0) - (chaveApi[k] || 0);
      var dA = (chaveApi[k] || 0) - (chaveOuro[k] || 0);
      if (dO > 0) soPdf += dO;
      if (dA > 0) soApi += dA;
    });

    var okQtd = qtdApi === meta.quantidade;
    var okSoma = Math.abs(somaApi - meta.soma) < 0.05;
    var msg =
      'COMPARAÇÃO API (aba) × PDF ouro\n\n' +
      'API: ' + qtdApi + ' linhas / R$ ' + somaApi.toFixed(2).replace('.', ',') + '\n' +
      'PDF: ' + meta.quantidade + ' linhas / R$ ' +
      String(meta.soma).replace('.', ',') + '\n' +
      'Qtd: ' + (okQtd ? '✅' : '❌') + '  Soma: ' + (okSoma ? '✅' : '❌') + '\n' +
      'Só no PDF: ' + soPdf + ' | Só na API: ' + soApi + '\n' +
      (okQtd && okSoma ? '\nMatch exato com o PDF ✅' : '\nAinda há divergência — veja o Log.');
    Logger.log(msg);
    ui.alert(msg.substring(0, 1800));
    return {
      ok: okQtd && okSoma,
      qtdApi: qtdApi,
      somaApi: somaApi,
      soPdf: soPdf,
      soApi: soApi
    };
  } catch (err) {
    ui.alert('⚠️ ' + (err.message || err));
    return { ok: false, erro: String(err.message || err) };
  }
}

/**
 * Testa filtro de datas da Taxa Adm (API = m/d/Y).
 * "03/06/2026" na API = 6 mar (fora de junho) — não pode entrar.
 */
function executarTestesDatasTaxaAdm() {
  var periodo = {
    inicioDate: new Date(2026, 5, 1),
    fimDate: new Date(2026, 5, 30)
  };
  // [valor, deveEntrarComUs, descricao]
  var casos = [
    ['06/01/2026', true, 'API m/d = 1 jun'],
    ['06/09/2026', true, 'API m/d = 9 jun (crédito PDF)'],
    ['06/15/2026', true, 'API m/d = 15 jun'],
    ['06/30/2026', true, 'API m/d = 30 jun'],
    ['2026-06-09', true, 'ISO 9 jun'],
    ['03/06/2026', false, 'API m/d = 6 mar (NÃO é 3 jun)'],
    ['05/06/2026', false, 'API m/d = 6 mai'],
    ['09/06/2026', false, 'API m/d = 6 set (PDF escreve dd/mm)'],
    ['05/31/2026', false, '31 mai'],
    ['07/01/2026', false, '1 jul']
  ];
  var ok = 0;
  var fail = 0;
  var out = ['TESTE DATAS API (m/d/Y) — 01/06/2026 a 30/06/2026', ''];
  casos.forEach(function (c) {
    var got = dataValorNoPeriodoApiUs_(c[0], periodo);
    var passou = got === c[1];
    if (passou) ok++; else fail++;
    out.push((passou ? 'OK  ' : 'FAIL') + ' ' + c[0] + ' us=' + got + ' | ' + c[2]);
  });

  var repOk = {
    dt_credito_recb: '06/09/2026',
    fl_status_rep: '1',
    vl_txadm_rep: 329.06,
    proprietarios_beneficiarios: [{ st_nome_pes: 'Teste', nm_fracao_prb: '100' }]
  };
  var repMar = {
    dt_credito_recb: '03/06/2026',
    fl_status_rep: '1',
    vl_txadm_rep: 100,
    proprietarios_beneficiarios: [{ st_nome_pes: 'Teste2', nm_fracao_prb: '100' }]
  };
  out.push('');
  out.push('Repasse 06/09 (9 jun) no período: ' + repasseNoPeriodoPdf_(repOk, periodo));
  out.push('Repasse 03/06 (6 mar) no período: ' + repasseNoPeriodoPdf_(repMar, periodo));
  out.push('Linhas expand 9 jun: ' + expandirLinhasTaxaAdmRepasse_(repOk).length);
  out.push('Alvo PDF: 363 linhas / R$ 84.509,30');
  out.push('Resumo testes: OK=' + ok + ' FAIL=' + fail);
  Logger.log(out.join('\n'));
  SpreadsheetApp.getUi().alert(out.join('\n'));
  return { ok: ok, fail: fail };
}

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

    // Ativos = /contratos. Inativos (não listados) entram por cobranças e/ou pesquisa.
    if (!contratos.length) {
      var idsMap = {};
      cobrancas.forEach(function (item) {
        var id = extrairContrato_(item);
        if (id) idsMap[String(id)] = true;
      });
      contratos = Object.keys(idsMap).map(function (id) {
        return { id_contrato_con: id };
      });
      Logger.log('Contratos vazios — fallback ids das cobranças: ' + contratos.length);
    } else if (CONFIG.TAXA_ADM_SOMENTE_CONTRATOS_ATIVOS !== true) {
      var extrasCob = [];
      var idsJaCob = {};
      contratos.forEach(function (c) {
        if (c && c.id_contrato_con != null && c.id_contrato_con !== '') {
          idsJaCob[String(c.id_contrato_con)] = true;
        }
      });
      cobrancas.forEach(function (item) {
        var id = extrairContrato_(item);
        if (!id || idsJaCob[String(id)]) return;
        idsJaCob[String(id)] = true;
        // Não veio da listagem /contratos → tratado como inativo.
        extrasCob.push({ id_contrato_con: id, fl_ativo_con: '0' });
      });
      if (extrasCob.length) {
        contratos = mesclarContratosPorId_(contratos, extrasCob);
        Logger.log('Contratos + ids cobranças (inativos): +' + extrasCob.length +
          ' → ' + contratos.length);
      }
    }

    if (
      CONFIG.TAXA_ADM_PESQUISAR_CONTRATOS_INATIVOS === true &&
      CONFIG.TAXA_ADM_SOMENTE_CONTRATOS_ATIVOS !== true &&
      contratos.length
    ) {
      try {
        var inativosPesq = buscarContratosInativosPorPesquisa_(contratos);
        if (inativosPesq.length) {
          contratos = mesclarContratosPorId_(contratos, inativosPesq);
          Logger.log(
            'Contratos + pesquisa inativos: +' + inativosPesq.length +
            ' → ' + contratos.length
          );
        }
      } catch (errPesq) {
        Logger.log('Pesquisa contratos inativos falhou: ' + errPesq);
      }
    }

    // Listagem /contratos = ativos; garante fl_ativo_con quando a API omite.
    contratos.forEach(function (c) {
      if (!c) return;
      if (c.fl_ativo_con === null || c.fl_ativo_con === undefined || c.fl_ativo_con === '') {
        c.fl_ativo_con = '1';
      }
    });
    try {
      escreverContratos_(ss, contratos);
    } catch (errWriteCon) {
      Logger.log('Regravação Contratos (com inativos) falhou: ' + errWriteCon);
    }

    var despesas = [];
    var repasses = [];
    var linhasTaxaAdm = [];
    try {
      // Fonte = API (/repasses). PDF ouro só entra na comparação ao final.
      if (contratos.length) {
        repasses = buscarRepassesDosContratos_(contratos, periodo);
      }
      if (CONFIG.TAXA_ADM_INCLUIR_DESPESAS === true) {
        try {
          despesas = buscarDespesasTaxaAdm_(contratos, periodo);
        } catch (errDesp) {
          Logger.log('Despesas falhou: ' + errDesp);
        }
      }
      linhasTaxaAdm = montarLinhasTaxaAdmRealizada_(
        cobrancas, despesas, repasses, periodo, contratos
      );
      escreverTaxaAdmRealizada_(ss, linhasTaxaAdm);
    } catch (errTaxa) {
      Logger.log('Falha ao montar Taxa Adm Realizada: ' + errTaxa);
      try {
        if (!linhasTaxaAdm.length) {
          linhasTaxaAdm = montarLinhasTaxaAdmRealizada_(
            cobrancas, [], repasses, periodo, contratos
          );
        }
        escreverTaxaAdmRealizada_(ss, linhasTaxaAdm);
      } catch (e2) {}
    }

    escreverResumo_(ss, cobrancas, contratos, linhasTaxaAdm, periodo);

    var somaTaxaAlert = 0;
    var contratosTaxa = {};
    var qtdDespesaAlert = 0;
    var somaDespesaAlert = 0;
    var contratosDespesaAlert = {};
    linhasTaxaAdm.forEach(function (r) {
      somaTaxaAlert += num_(r.valor);
      if (r.numero_contrato) contratosTaxa[String(r.numero_contrato)] = true;
      if (r.fonte === 'despesa') {
        qtdDespesaAlert++;
        somaDespesaAlert += num_(r.valor);
        if (r.numero_contrato) contratosDespesaAlert[String(r.numero_contrato)] = true;
      }
    });

    var porFonteAlert = {};
    var somaLinhasAlert = 0;
    linhasTaxaAdm.forEach(function (r) {
      var f = r.fonte || '?';
      if (!porFonteAlert[f]) porFonteAlert[f] = { qtd: 0, soma: 0 };
      porFonteAlert[f].qtd++;
      porFonteAlert[f].soma += num_(r.valor);
      somaLinhasAlert += num_(r.valor);
    });
    var fontesTxt = Object.keys(porFonteAlert).map(function (f) {
      return f + ': ' + porFonteAlert[f].qtd + ' / R$ ' +
        porFonteAlert[f].soma.toFixed(2).replace('.', ',');
    }).join('\n');

    var batePdf =
      Math.abs(somaLinhasAlert - 84509.30) < 0.05 && linhasTaxaAdm.length === 363;
    var alvoAtivos = CONFIG.TAXA_ADM_ALVO_LINHAS_ATIVOS_JUN2026 || 351;
    var alvoApi = CONFIG.TAXA_ADM_ALVO_LINHAS_API_JUN2026 || 367;
    var comInativos = CONFIG.TAXA_ADM_SOMENTE_CONTRATOS_ATIVOS !== true;
    var bateApiAtivos =
      periodoEhJunho2026_(periodo) &&
      linhasTaxaAdm.length === (comInativos ? alvoApi : alvoAtivos);
    var diagR = diagnosticarRepassesTaxaAdm_(repasses, periodo);
    var avisoPdf =
      '\nFonte: API /repasses' +
      (comInativos ? ' (ativos + inativos via cobranças/pesquisa)' : ' (só ativos)') +
      '\n' +
      '• Filtro data: dt_credito_recb | dt_repasse_rep | dt_pagamento (m/d/Y)\n' +
      '• Linhas: ' + linhasTaxaAdm.length +
      ' (API jun≈' + (comInativos ? alvoApi : alvoAtivos) +
      ' | PDF=363)\n' +
      '• Soma: R$ ' + somaLinhasAlert.toFixed(2).replace('.', ',') +
      ' (PDF 84.509,30)\n' +
      '• Match API (' + (comInativos ? alvoApi : alvoAtivos) + '): ' +
      (bateApiAtivos ? 'SIM ✅' : 'NÃO ❌') + '\n' +
      '• Match PDF (363): ' + (batePdf ? 'SIM ✅' : 'NÃO ❌') + '\n' +
      '• Repasses no período: ' + diagR.noPeriodo +
      ' → linhas rateio ' + diagR.linhas + '\n';

    var msgFinal =
      '✅ Importação concluída!\n\n' +
      cobrancas.length + ' recebimento(s)\n' +
      contratos.length + ' contrato(s)\n' +
      'Repasses API: ' + repasses.length + '\n' +
      '\nTaxa Adm Realizada:\n' +
      '• Linhas: ' + linhasTaxaAdm.length + '\n' +
      '• Soma total: R$ ' + somaLinhasAlert.toFixed(2).replace('.', ',') + '\n' +
      (fontesTxt ? fontesTxt + '\n' : '') +
      avisoPdf +
      (periodo ? '\nPeríodo: ' + periodo.rotulo : '');

    escreverLog_(
      ss,
      cobrancas.length,
      inicio,
      null,
      (periodo ? ('Período: ' + periodo.rotulo) : 'Importação completa') +
      ' | Contratos: ' + contratos.length +
      ' | TaxaAdm: ' + linhasTaxaAdm.length +
      ' | soma=' + somaLinhasAlert.toFixed(2) +
      ' | fonte=API_REPASSE_ATIVOS | Repasses=' + repasses.length +
      ' | matchApiAtivos=' + bateApiAtivos +
      ' | matchPdf363=' + batePdf
    );

    ui.alert(msgFinal.substring(0, 1800));
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
  aplicarFormatoMoedaColunas_(sh, headers, rows.length);
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
  aplicarFormatoMoedaColunas_(sh, headers, rows.length);
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
      statusAtivoContratoTexto_(c.fl_ativo_con) || 'Ativo',
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
  // Moeda: aluguel + estimativa em R$. tx_adm_con / tx_adm_imovel podem ser % — fora.
  aplicarFormatoMoedaColunas_(sh, headers, rows.length, [
    'tx_adm_estimativa_mes',
    'vl_aluguel_con'
  ]);
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
      if (campo === 'valor' || campo === 'vl_aluguel_base') return num_(v);
      return v === null || v === undefined ? '' : v;
    });
  });

  escreverTabela_(sh, headers, rows);
  // valor e base de aluguel em R$; tx_adm pode ser percentual
  aplicarFormatoMoedaColunas_(sh, headers, rows.length, ['valor', 'vl_aluguel_base']);
}

/**
 * Monta a aba CONFIG.ABA_RESUMO com KPIs e blocos analíticos.
 * @param {SpreadsheetApp.Spreadsheet} ss
 * @param {Object[]} cobrancas
 * @param {Object[]} contratos
 * @param {Object[]} linhasTaxaAdm
 * @param {{rotulo?: string}=} periodo opcional (ex.: importação por período)
 * @return {{somaTaxa: number, somaRepasse: number, coberturaPct: number}}
 */
function escreverResumo_(ss, cobrancas, contratos, linhasTaxaAdm, periodo) {
  var sh = ensureSheet_(ss, CONFIG.ABA_RESUMO);
  limparAba_(sh);

  contratos = contratos || [];
  linhasTaxaAdm = linhasTaxaAdm || [];
  cobrancas = cobrancas || [];

  var TOP_PRODUTOS = 30;
  var TOP_CONTRATOS = 50;
  var ORDEM_FONTES = ['repasse', 'despesa', 'composicao', 'w196a_csv', 'w196a_sessao'];

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
    if (!porContrato[contrato]) {
      porContrato[contrato] = { qtd: 0, total: 0, cliente: item.st_nome_sac || '' };
    }
    porContrato[contrato].qtd++;
    porContrato[contrato].total += total;

    (item.compo_recebimento || []).forEach(function (c) {
      var p = String(c.st_descricao_prd || '(sem produto)').trim() || '(sem produto)';
      if (!porProduto[p]) porProduto[p] = { qtd: 0, total: 0 };
      porProduto[p].qtd++;
      porProduto[p].total += num_(c.st_valor_comp);
    });
  });

  var porTipoAdm = { Percentual: { qtd: 0, estimativa: 0 }, 'Valor fixo': { qtd: 0, estimativa: 0 } };
  var somaEstimativaAdm = 0;
  var qtdContratosAtivosCad = 0;
  var qtdContratosInativosCad = 0;
  contratos.forEach(function (c) {
    var tipo = txAdmTipo_(c.fl_txadmvalorfixo_con);
    var est = txAdmEstimativaMes_(c);
    if (!porTipoAdm[tipo]) porTipoAdm[tipo] = { qtd: 0, estimativa: 0 };
    porTipoAdm[tipo].qtd++;
    porTipoAdm[tipo].estimativa += est;
    somaEstimativaAdm += est;
    if (String(c.fl_ativo_con) === '0') qtdContratosInativosCad++;
    else qtdContratosAtivosCad++;
  });

  var porFonteTaxa = {};
  var somaTaxaRealizada = 0;
  var contratosDistintosTodas = {};
  var contratosDistintosDespesa = {};
  var contratosDistintosRepasse = {};
  var qtdDespesa = 0;
  var somaDespesa = 0;
  var qtdRepasse = 0;
  var somaRepasse = 0;
  var porAtivoRepasse = {
    Ativo: { qtd: 0, total: 0, contratos: {} },
    Inativo: { qtd: 0, total: 0, contratos: {} },
    '(sem)': { qtd: 0, total: 0, contratos: {} }
  };

  linhasTaxaAdm.forEach(function (r) {
    var f = String(r.fonte || '(sem)').trim() || '(sem)';
    if (!porFonteTaxa[f]) porFonteTaxa[f] = { qtd: 0, total: 0, contratos: {} };
    var valorLinha = num_(r.valor);
    porFonteTaxa[f].qtd++;
    porFonteTaxa[f].total += valorLinha;
    somaTaxaRealizada += valorLinha;

    var nc = String(r.numero_contrato || '').trim();
    if (nc) {
      contratosDistintosTodas[nc] = true;
      porFonteTaxa[f].contratos[nc] = true;
    }

    if (f === 'despesa') {
      qtdDespesa++;
      somaDespesa += valorLinha;
      if (nc) contratosDistintosDespesa[nc] = true;
    } else if (f === 'repasse') {
      qtdRepasse++;
      somaRepasse += valorLinha;
      if (nc) contratosDistintosRepasse[nc] = true;

      var ativoKey = String(r.contrato_ativo || '').trim();
      if (ativoKey !== 'Ativo' && ativoKey !== 'Inativo') ativoKey = '(sem)';
      if (!porAtivoRepasse[ativoKey]) {
        porAtivoRepasse[ativoKey] = { qtd: 0, total: 0, contratos: {} };
      }
      porAtivoRepasse[ativoKey].qtd++;
      porAtivoRepasse[ativoKey].total += valorLinha;
      if (nc) porAtivoRepasse[ativoKey].contratos[nc] = true;
    }
  });

  var out = [];
  var meta = [];
  function add_(row, kind, moneyCols) {
    out.push(row);
    meta.push({ kind: kind || 'data', moneyCols: moneyCols || [] });
  }
  function blank_() { add_([''], 'blank'); }
  function round2_(n) { return Math.round(num_(n) * 100) / 100; }
  function pct_(num, den) {
    if (!den) return 0;
    return round2_((num_(num) / num_(den)) * 100);
  }
  function sortFontes_(keys) {
    return keys.slice().sort(function (a, b) {
      var ia = ORDEM_FONTES.indexOf(a);
      var ib = ORDEM_FONTES.indexOf(b);
      if (ia < 0) ia = 999;
      if (ib < 0) ib = 999;
      if (ia !== ib) return ia - ib;
      return String(a).localeCompare(String(b));
    });
  }

  var ticketMedio = cobrancas.length ? round2_(totalGeral / cobrancas.length) : 0;
  var gapCadastroVsRepasse = round2_(somaRepasse - somaEstimativaAdm);
  var coberturaRepassePct = pct_(somaRepasse, somaEstimativaAdm);
  var coberturaTodasPct = pct_(somaTaxaRealizada, somaEstimativaAdm);
  var gapKind = gapCadastroVsRepasse >= 0 ? 'gap_pos' : 'gap_neg';

  // —— 1. Título / visão geral ——
  add_(['RESUMO ANALÍTICO'], 'title');
  add_(['Gerado em', new Date()], 'kpi');
  if (periodo && periodo.rotulo) {
    add_(['Período', String(periodo.rotulo)], 'kpi');
  }
  blank_();
  add_(['1. VISÃO GERAL'], 'section');
  add_(['Indicador', 'Valor'], 'header');
  add_(['Cobranças (recebimentos)', cobrancas.length], 'kpi');
  add_(['Soma cobranças (vl_total_recb)', round2_(totalGeral)], 'kpi', [1]);
  add_(['Ticket médio (cobrança)', ticketMedio], 'kpi', [1]);
  add_(['Contratos na importação', contratos.length], 'kpi');
  add_(['  ├ Ativos', qtdContratosAtivosCad], 'accent_ativo');
  add_(['  └ Inativos', qtdContratosInativosCad], 'accent_inativo');
  add_(['Estimativa taxa adm/mês (cadastro)', round2_(somaEstimativaAdm)], 'kpi', [1]);
  add_(['Taxa Adm Realizada (todas as fontes)', round2_(somaTaxaRealizada)], 'kpi', [1]);
  add_(['  └ só repasses', round2_(somaRepasse)], 'total', [1]);
  add_(['Cobertura repasse ÷ cadastro (%)', coberturaRepassePct], 'kpi');
  add_(['Cobertura todas ÷ cadastro (%)', coberturaTodasPct], 'kpi');
  add_(['Gap (repasse − cadastro) R$', gapCadastroVsRepasse], gapKind, [1]);

  // —— 2. Repasses ativo/inativo (destaque) ——
  blank_();
  add_(['2. REPASSES — ATIVO × INATIVO'], 'section');
  add_(['Fonte: aba Taxa Adm Realizada · coluna contrato_ativo'], 'note');
  add_(['Situação', 'Linhas', 'Contratos', 'Soma R$', '% do total'], 'header');
  ['Ativo', 'Inativo', '(sem)'].forEach(function (k) {
    var bloco = porAtivoRepasse[k];
    if (!bloco || (!bloco.qtd && k === '(sem)')) return;
    var kindRow = k === 'Ativo' ? 'accent_ativo' : (k === 'Inativo' ? 'accent_inativo' : 'data');
    add_([
      k,
      bloco.qtd,
      Object.keys(bloco.contratos).length,
      round2_(bloco.total),
      pct_(bloco.total, somaRepasse)
    ], kindRow, [3]);
  });
  add_([
    'Total repasses',
    qtdRepasse,
    Object.keys(contratosDistintosRepasse).length,
    round2_(somaRepasse),
    somaRepasse ? 100 : 0
  ], 'total', [3]);

  // —— 3. Por fonte ——
  blank_();
  add_(['3. TAXA ADM REALIZADA POR FONTE'], 'section');
  add_(['fonte', 'Linhas', 'Contratos', 'Soma R$', '% do total'], 'header');
  var fontes = sortFontes_(Object.keys(porFonteTaxa));
  fontes.forEach(function (k) {
    add_([
      k,
      porFonteTaxa[k].qtd,
      Object.keys(porFonteTaxa[k].contratos).length,
      round2_(porFonteTaxa[k].total),
      pct_(porFonteTaxa[k].total, somaTaxaRealizada)
    ], 'data', [3]);
  });
  if (!fontes.length) {
    add_(['(sem lançamentos)', 0, 0, 0, 0], 'data', [3]);
  }
  add_([
    'Total',
    linhasTaxaAdm.length,
    Object.keys(contratosDistintosTodas).length,
    round2_(somaTaxaRealizada),
    somaTaxaRealizada ? 100 : 0
  ], 'total', [3]);

  // —— 4. Conferência compacta ——
  blank_();
  add_(['4. CONFERÊNCIA (DESPESA × REPASSE × TOTAL)'], 'section');
  add_(['Comparativo auxiliar — PDF ouro usa regra própria de movimentações'], 'note');
  add_(['Métrica', 'Despesa', 'Repasse', 'Todas as fontes'], 'header');
  add_([
    'Linhas',
    qtdDespesa,
    qtdRepasse,
    linhasTaxaAdm.length
  ], 'data');
  add_([
    'Contratos distintos',
    Object.keys(contratosDistintosDespesa).length,
    Object.keys(contratosDistintosRepasse).length,
    Object.keys(contratosDistintosTodas).length
  ], 'data');
  add_([
    'Soma R$',
    round2_(somaDespesa),
    round2_(somaRepasse),
    round2_(somaTaxaRealizada)
  ], 'total', [1, 2, 3]);

  // —— 5. Cadastro ——
  blank_();
  add_(['5. TAXA ADM CADASTRADA (aba Contratos)'], 'section');
  add_(['Tipo', 'Contratos', 'Estimativa/mês R$', '% da estimativa'], 'header');
  Object.keys(porTipoAdm).forEach(function (k) {
    add_([
      k,
      porTipoAdm[k].qtd,
      round2_(porTipoAdm[k].estimativa),
      pct_(porTipoAdm[k].estimativa, somaEstimativaAdm)
    ], 'data', [2]);
  });
  add_(['Total', contratos.length, round2_(somaEstimativaAdm), somaEstimativaAdm ? 100 : 0], 'total', [2]);

  // —— 6. Cobranças por status ——
  blank_();
  add_(['6. COBRANÇAS POR STATUS'], 'section');
  add_(['Status', 'Qtd', 'Soma R$', '% da soma'], 'header');
  Object.keys(porStatus).sort().forEach(function (k) {
    add_([
      k,
      porStatus[k].qtd,
      round2_(porStatus[k].total),
      pct_(porStatus[k].total, totalGeral)
    ], 'data', [2]);
  });
  if (!Object.keys(porStatus).length) {
    add_(['(sem cobranças)', 0, 0, 0], 'data', [2]);
  }

  // —— 7. Produtos (top N) ——
  blank_();
  add_(['7. PRODUTOS NA COMPOSIÇÃO (TOP ' + TOP_PRODUTOS + ')'], 'section');
  add_(['Produto', 'Qtd', 'Soma R$'], 'header');
  var produtosOrdenados = Object.keys(porProduto).sort(function (a, b) {
    return porProduto[b].total - porProduto[a].total;
  });
  produtosOrdenados.slice(0, TOP_PRODUTOS).forEach(function (k) {
    add_([k, porProduto[k].qtd, round2_(porProduto[k].total)], 'data', [2]);
  });
  if (!produtosOrdenados.length) {
    add_(['(sem composição)', 0, 0], 'data', [2]);
  } else if (produtosOrdenados.length > TOP_PRODUTOS) {
    var restoQtd = 0;
    var restoTotal = 0;
    produtosOrdenados.slice(TOP_PRODUTOS).forEach(function (k) {
      restoQtd += porProduto[k].qtd;
      restoTotal += porProduto[k].total;
    });
    add_([
      '(+ ' + (produtosOrdenados.length - TOP_PRODUTOS) + ' outros)',
      restoQtd,
      round2_(restoTotal)
    ], 'total', [2]);
  }

  // —— 8. Top contratos ——
  blank_();
  add_(['8. TOP ' + TOP_CONTRATOS + ' CONTRATOS (COBRANÇAS)'], 'section');
  add_(['Contrato', 'Cliente', 'Qtd', 'Soma R$'], 'header');
  var contratosOrdenados = Object.keys(porContrato).map(function (k) {
    return { k: k, v: porContrato[k] };
  }).sort(function (a, b) {
    return b.v.total - a.v.total;
  });
  contratosOrdenados.slice(0, TOP_CONTRATOS).forEach(function (o) {
    add_([o.k, o.v.cliente, o.v.qtd, round2_(o.v.total)], 'data', [3]);
  });
  if (!contratosOrdenados.length) {
    add_(['(sem contratos)', '', 0, 0], 'data', [3]);
  }

  var maxCols = 5;
  out.forEach(function (r) {
    if (r.length > maxCols) maxCols = r.length;
  });
  var matriz = out.map(function (r) {
    var copy = r.slice();
    while (copy.length < maxCols) copy.push('');
    return copy.slice(0, maxCols);
  });
  sh.getRange(1, 1, matriz.length, maxCols).setValues(matriz);
  formatarAbaResumoAnalitico_(sh, matriz, meta, maxCols);
  try {
    sh.activate();
  } catch (eAct) {}

  return {
    somaTaxa: round2_(somaTaxaRealizada),
    somaRepasse: round2_(somaRepasse),
    coberturaPct: coberturaRepassePct
  };
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
