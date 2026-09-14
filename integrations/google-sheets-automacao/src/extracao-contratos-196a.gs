var PREFIXO_ABA_ORIGEM = "196A";
var LINHA_INICIO_DESTINO = 2; // contrato-extraido: dados a partir da linha 2
var LINHA_INICIO_ORIGEM = 6;  // Aba 196A: preserva cabeçalho do relatório (linhas 1-5)

/**
 * Aba fixa de destino da extração de contratos.
 * Nome EXATO da aba na planilha (não usa a aba ativa).
 */
var NOME_ABA_DESTINO = 'contrato-extraido';

/** Abas do analítico / origem que NUNCA podem receber a extração. */
var ABAS_BLOQUEADAS_DESTINO = [
  'Log Importação',
  'Recebimentos',
  'Composição',
  'Contratos',
  'Taxa Adm Realizada',
  'Resumo Analítico'
];

// Drive — pasta 196a-automacao-superlogica-controller
var DRIVE_PASTA_NOME = '196a-automacao-superlogica-controller';
var DRIVE_SUBPASTA_ERRO = 'execucoes-com-erro';
var DRIVE_FOLDER_ID_PROP = 'DRIVE_FOLDER_ID';
var DRIVE_TRIGGER_HANDLER = 'importarCsvDrive196A';

function criarMenuAutomacoes196A_() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Automações Privadas')
    .addItem('📥 Importar CSV do Drive (196A)', 'importarCsvDrive196A')
    .addItem('📄 Extrair Contratos', 'executarExtracaoContratos196A')
    .addSeparator()
    .addItem('🧹 Limpar Aba Destino', 'limparPlanilha')
    .addSeparator()
    .addItem('⏱ Instalar acionador Drive (15 min)', 'instalarAcionadorDrive196A')
    .addItem('⏹ Remover acionadores Drive', 'removerAcionadoresDrive196A')
    .addToUi();
}

/**
 * Não declare onOpen neste arquivo se o projeto também tiver
 * superlogica-cobrancas-analitico.gs (ele já chama criarMenuAutomacoes196A_).
 */
// function onOpen() { criarMenuAutomacoes196A_(); }

function normalizarTexto(texto) {
  if (texto === null || texto === undefined || texto === "") return "";
  return texto.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isAbaOrigem(aba) {
  return aba.getName().indexOf(PREFIXO_ABA_ORIGEM) !== -1;
}

function isAbaBloqueadaDestino_(aba) {
  if (!aba) return true;
  if (isAbaOrigem(aba)) return true;
  var nome = aba.getName();
  for (var i = 0; i < ABAS_BLOQUEADAS_DESTINO.length; i++) {
    if (nome === ABAS_BLOQUEADAS_DESTINO[i]) return true;
  }
  return false;
}

function obterAbaOrigem(ss) {
  var abas = ss.getSheets();
  var i;
  // Preferência: nomes que começam com W196A / 196A (ex.: "W196A Oficial")
  for (i = 0; i < abas.length; i++) {
    var n = abas[i].getName();
    if (/^W?196A/i.test(n)) return abas[i];
  }
  for (i = 0; i < abas.length; i++) {
    if (isAbaOrigem(abas[i])) return abas[i];
  }
  return null;
}

/**
 * Destino fixo (NOME_ABA_DESTINO). Não usa a aba ativa.
 */
function obterAbaDestinoExtracao_(ss) {
  var nome = (NOME_ABA_DESTINO || '').trim();
  if (!nome) {
    throw new Error(
      'NOME_ABA_DESTINO não configurado no script. ' +
      'Defina o nome exato da aba de destino (ex.: contrato-extraido).'
    );
  }

  var aba = ss.getSheetByName(nome);
  if (!aba) {
    throw new Error(
      'Aba de destino "' + nome + '" não encontrada.\n\n' +
      'Crie a aba ou altere NOME_ABA_DESTINO no extracao-contratos-196a.gs ' +
      'para o nome exato da aba do financeiro.'
    );
  }

  if (isAbaBloqueadaDestino_(aba)) {
    throw new Error(
      'Aba "' + nome + '" está bloqueada para extração.\n\n' +
      'Escolha outra aba de destino (não use Log Importação, 196A nem abas do analítico).'
    );
  }

  return aba;
}

function encontrarLinhaCabecalho(aba) {
  var ultimaLinha = Math.min(aba.getLastRow(), 50);
  var ultimaCol = Math.min(Math.max(aba.getLastColumn(), 4), 20);

  if (ultimaLinha === 0) return null;

  var dados = aba.getRange(1, 1, ultimaLinha, ultimaCol).getValues();

  for (var i = 0; i < dados.length; i++) {
    var temCredito = false;
    var temVencimento = false;
    var temDescricao = false;
    var temValor = false;

    for (var j = 0; j < dados[i].length; j++) {
      var cel = normalizarTexto(dados[i][j]);
      if (!cel) continue;
      if (cel.indexOf("credito") !== -1) temCredito = true;
      if (cel.indexOf("vencimento") !== -1) temVencimento = true;
      if (cel.indexOf("descricao") !== -1) temDescricao = true;
      if (cel === "valor" || cel.indexOf("valor") !== -1) temValor = true;
    }

    if (temCredito && temVencimento && (temDescricao || temValor)) {
      return i + 1;
    }
  }
  return null;
}

function obterIndicesColunas(aba, linhaCabecalho) {
  var ultimaCol = Math.min(Math.max(aba.getLastColumn(), 4), 20);
  var cabecalhos = aba.getRange(linhaCabecalho, 1, 1, ultimaCol).getValues()[0];

  var indices = {
    credito: null,
    vencimento: null,
    descricao: null,
    valor: null
  };

  for (var col = 0; col < cabecalhos.length; col++) {
    var texto = normalizarTexto(cabecalhos[col]);
    if (!texto) continue;

    if (indices.credito === null && texto.indexOf("credito") !== -1) {
      indices.credito = col;
    } else if (indices.vencimento === null && texto.indexOf("vencimento") !== -1) {
      indices.vencimento = col;
    } else if (indices.descricao === null && texto.indexOf("descricao") !== -1) {
      indices.descricao = col;
    } else if (indices.valor === null && texto.indexOf("valor") !== -1) {
      indices.valor = col;
    }
  }

  return indices;
}

function linhaTemDadoValido(credito, vencimento, descricao, valor) {
  if (!credito && !vencimento && !descricao && !valor) return false;

  var textoCredito = normalizarTexto(credito);
  var textoVencimento = normalizarTexto(vencimento);
  var textoDescricao = normalizarTexto(descricao);

  if (textoCredito.indexOf("credito") !== -1 && textoVencimento.indexOf("vencimento") !== -1) {
    return false;
  }
  if (textoDescricao.indexOf("cema consultoria") !== -1) return false;
  if (textoDescricao.indexOf("movimentacoes de taxa") !== -1) return false;
  if (textoDescricao.indexOf("conta categoria") !== -1) return false;

  return true;
}

function obterLinhaInicioLimpeza(aba) {
  return isAbaOrigem(aba) ? LINHA_INICIO_ORIGEM : LINHA_INICIO_DESTINO;
}

/**
 * Limpa destino em A:K (remove lixo antigo em H/K das versões anteriores).
 * A gravação nova preenche só A:G.
 */
function limparAba(aba) {
  var linhaInicio = obterLinhaInicioLimpeza(aba);
  var ultimaLinha = aba.getLastRow();

  if (ultimaLinha < linhaInicio) return false;

  if (isAbaOrigem(aba)) {
    var linhasParaLimpar = ultimaLinha - linhaInicio + 1;
    aba.getRange(linhaInicio, 1, linhasParaLimpar, 4).clearContent();
    Logger.log("Aba 196A limpa a partir da linha " + linhaInicio + ": " + aba.getName());
  } else {
    // A1 explícito: limpa A até K (inclui residual H/K de layouts antigos)
    aba.getRange('A' + linhaInicio + ':K' + ultimaLinha).clearContent();
    Logger.log(
      "Aba destino limpa A:K a partir da linha " + linhaInicio + ": " + aba.getName()
    );
  }

  return true;
}

function limparPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaAtiva = ss.getActiveSheet();
  var aba;

  if (isAbaOrigem(abaAtiva)) {
    aba = abaAtiva;
  } else {
    try {
      aba = obterAbaDestinoExtracao_(ss);
    } catch (errDest) {
      SpreadsheetApp.getUi().alert('⚠️ ' + (errDest.message || errDest));
      return;
    }
  }

  var linhaInicio = obterLinhaInicioLimpeza(aba);
  limparAba(aba);

  if (isAbaOrigem(aba)) {
    SpreadsheetApp.getUi().alert(
      '✅ Dados limpos na aba "' + aba.getName() + '" a partir da linha ' + linhaInicio + '.\n' +
      '(Linhas 1 a ' + (linhaInicio - 1) + ' do relatório preservadas.)'
    );
  } else {
    SpreadsheetApp.getUi().alert(
      '✅ Dados limpos na aba "' + aba.getName() + '" a partir da linha ' + linhaInicio + '.\n' +
      '(Linha 1 = cabeçalho preservado. Colunas A:K limpas.)'
    );
  }
}

/**
 * Grava coluna por notação A1 (evita confusão row/col vs H/K).
 * Layout destino: A B C D E F G (sequencial).
 */
function gravarColunaDestino_(aba, letraColuna, linhaInicio, valores) {
  if (!valores || !valores.length) return;
  var linhaFim = linhaInicio + valores.length - 1;
  aba.getRange(letraColuna + linhaInicio + ':' + letraColuna + linhaFim).setValues(valores);
}

/**
 * Extração 196A → contrato-extraido (colunas A–G).
 * Nome único para não colidir com cópia antiga "executarExtracao" no Apps Script
 * (versão antiga gravava santander/locacao em H e K).
 */
function executarExtracaoContratos196A() {
  Logger.log("=== INÍCIO EXTRAÇÃO A–G → " + NOME_ABA_DESTINO + " ===");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaOrigem = obterAbaOrigem(ss);
  var abaDestino;

  if (!abaOrigem) {
    SpreadsheetApp.getUi().alert('⚠️ Aba de origem 196A não encontrada nesta planilha.');
    return;
  }

  try {
    abaDestino = obterAbaDestinoExtracao_(ss);
  } catch (errDest) {
    SpreadsheetApp.getUi().alert('⚠️ ' + (errDest.message || errDest));
    return;
  }

  var linhaCabecalho = encontrarLinhaCabecalho(abaOrigem);
  if (!linhaCabecalho) {
    SpreadsheetApp.getUi().alert(
      '⚠️ Cabeçalho não encontrado na aba 196A.\n\n' +
      'Procurei a linha com: Crédito, Vencimento, Descrição e Valor.'
    );
    return;
  }

  var cols = obterIndicesColunas(abaOrigem, linhaCabecalho);
  if (cols.credito === null || cols.vencimento === null) {
    SpreadsheetApp.getUi().alert('⚠️ Colunas Crédito e Vencimento não identificadas.');
    return;
  }

  var linhaInicio = linhaCabecalho + 1;
  var ultimaLinha = abaOrigem.getLastRow();
  var numLinhas = ultimaLinha - linhaCabecalho;

  if (numLinhas <= 0) {
    SpreadsheetApp.getUi().alert('⚠️ Nenhuma linha de dados após o cabeçalho na aba 196A.');
    return;
  }

  var maxCol = Math.max(
    cols.credito,
    cols.vencimento,
    cols.descricao !== null ? cols.descricao : 0,
    cols.valor !== null ? cols.valor : 0
  ) + 1;

  var dadosCompletos = abaOrigem.getRange(linhaInicio, 1, numLinhas, maxCol).getValues();

  Logger.log("Cabeçalho na linha: " + linhaCabecalho);
  Logger.log("Dados da linha " + linhaInicio + " até " + ultimaLinha);
  Logger.log("Colunas -> Crédito:" + cols.credito + " Vencimento:" + cols.vencimento +
    " Descrição:" + cols.descricao + " Valor:" + cols.valor);
  Logger.log("Destino fixo: " + abaDestino.getName() + " (A:G)");

  var colunaA_Destino = [];
  var colunaB_Destino = [];
  var colunaC_Destino = [];
  var colunaD_Destino = [];
  var colunaE_Destino = [];
  var colunaF_Destino = [];
  var colunaG_Destino = [];

  var regex = /Contrato(?:\s*n[º°\.]*)?\s*(\d{2,6})/i;
  var contratosEncontradosContador = 0;

  for (var i = 0; i < dadosCompletos.length; i++) {
    var valorCredito = dadosCompletos[i][cols.credito];
    var valorVencimento = dadosCompletos[i][cols.vencimento];
    var valorDescricao = cols.descricao !== null ? dadosCompletos[i][cols.descricao] : "";
    var valorValor = cols.valor !== null ? dadosCompletos[i][cols.valor] : "";

    if (!linhaTemDadoValido(valorCredito, valorVencimento, valorDescricao, valorValor)) {
      continue;
    }

    colunaA_Destino.push([valorVencimento]);
    colunaB_Destino.push([valorVencimento]);
    colunaC_Destino.push([valorCredito]);

    var textoDescricao = valorDescricao ? valorDescricao.toString() : "";
    var buscaContrato = textoDescricao.match(regex);

    if (buscaContrato && buscaContrato[1]) {
      colunaD_Destino.push(["Contrato " + buscaContrato[1]]);
      contratosEncontradosContador++;
    } else {
      colunaD_Destino.push([""]);
    }

    colunaE_Destino.push([valorValor]);
    colunaF_Destino.push(["santander"]);
    colunaG_Destino.push(["locacao"]);
  }

  if (colunaA_Destino.length === 0) {
    SpreadsheetApp.getUi().alert(
      '⚠️ Nenhum dado válido encontrado após o cabeçalho na aba 196A.\n\n' +
      'Cabeçalho detectado na linha ' + linhaCabecalho + '.'
    );
    return;
  }

  limparAba(abaDestino);

  var totalLinhasInseridas = colunaA_Destino.length;
  var linhaGravacao = LINHA_INICIO_DESTINO;

  try {
    // Sequência explícita A–G (NÃO grava em H nem K)
    gravarColunaDestino_(abaDestino, 'A', linhaGravacao, colunaA_Destino);
    gravarColunaDestino_(abaDestino, 'B', linhaGravacao, colunaB_Destino);
    gravarColunaDestino_(abaDestino, 'C', linhaGravacao, colunaC_Destino);
    gravarColunaDestino_(abaDestino, 'D', linhaGravacao, colunaD_Destino);
    gravarColunaDestino_(abaDestino, 'E', linhaGravacao, colunaE_Destino);
    gravarColunaDestino_(abaDestino, 'F', linhaGravacao, colunaF_Destino); // santander
    gravarColunaDestino_(abaDestino, 'G', linhaGravacao, colunaG_Destino); // locacao

    // Prova no log: célula F2 / G2 devem ter santander / locacao
    Logger.log(
      'Prova F' + linhaGravacao + '=' + abaDestino.getRange('F' + linhaGravacao).getValue() +
      ' | G' + linhaGravacao + '=' + abaDestino.getRange('G' + linhaGravacao).getValue() +
      ' | H' + linhaGravacao + '=' + abaDestino.getRange('H' + linhaGravacao).getValue() +
      ' | K' + linhaGravacao + '=' + abaDestino.getRange('K' + linhaGravacao).getValue()
    );
  } catch (erroGrava) {
    Logger.log("ERRO NA GRAVAÇÃO: " + erroGrava.toString());
    SpreadsheetApp.getUi().alert('⚠️ Erro na gravação: ' + erroGrava.toString());
    return;
  }

  var provaF = abaDestino.getRange('F' + linhaGravacao).getDisplayValue();
  var provaG = abaDestino.getRange('G' + linhaGravacao).getDisplayValue();
  var provaH = abaDestino.getRange('H' + linhaGravacao).getDisplayValue();
  var provaK = abaDestino.getRange('K' + linhaGravacao).getDisplayValue();

  Logger.log("=== FIM DA EXECUÇÃO (executarExtracaoContratos196A) ===");
  SpreadsheetApp.getUi().alert(
    '✅ Extração A–G concluída!\n\n' +
    totalLinhasInseridas + ' linhas importadas.\n' +
    contratosEncontradosContador + ' contratos formatados.\n\n' +
    'Função: executarExtracaoContratos196A\n' +
    'Origem: ' + abaOrigem.getName() + '\n' +
    'Destino: ' + abaDestino.getName() + '\n\n' +
    'Prova linha ' + linhaGravacao + ':\n' +
    'F = "' + provaF + '" (esperado: santander)\n' +
    'G = "' + provaG + '" (esperado: locacao)\n' +
    'H = "' + provaH + '" (esperado: vazio)\n' +
    'K = "' + provaK + '" (esperado: vazio)'
  );
}

// =============================================================================
// Importação CSV do Drive → aba 196A*
// Sucesso: lixeira | Falha: execucoes-com-erro
// =============================================================================

function importarCsvDrive196A() {
  var resumo = {
    ok: 0,
    erro: 0,
    ignorados: 0,
    mensagens: []
  };

  try {
    var ss = obterPlanilha196A_();
    var pasta = obterPastaEntrada196A_();
    var pastaErro = obterOuCriarSubpasta196A_(pasta, DRIVE_SUBPASTA_ERRO);
    var arquivos = listarCsvsNaRaiz196A_(pasta);

    if (arquivos.length === 0) {
      notificar196A_('Nenhum CSV na pasta "' + DRIVE_PASTA_NOME + '".');
      return resumo;
    }

    for (var i = 0; i < arquivos.length; i++) {
      var file = arquivos[i];
      try {
        var rows = lerCsv196A_(file);
        validarCsv196A_(rows);
        escreverAbaOrigem196A_(ss, rows);
        file.setTrashed(true);
        resumo.ok++;
        resumo.mensagens.push('OK ' + file.getName());
        Logger.log('[196A Drive] importado e lixeira: ' + file.getName());
      } catch (errFile) {
        moverParaErro196A_(file, pasta, pastaErro);
        resumo.erro++;
        resumo.mensagens.push('ERRO ' + file.getName() + ': ' + errFile);
        Logger.log('[196A Drive] falha ' + file.getName() + ': ' + errFile);
      }
    }
  } catch (err) {
    resumo.erro++;
    resumo.mensagens.push(String(err));
    Logger.log('[196A Drive] falha geral: ' + err);
  }

  notificar196A_(montarResumo196A_(resumo));
  return resumo;
}

function instalarAcionadorDrive196A() {
  removerAcionadoresDrive196A();
  ScriptApp.newTrigger(DRIVE_TRIGGER_HANDLER)
    .timeBased()
    .everyMinutes(15)
    .create();
  notificar196A_('Acionador instalado: a cada 15 min chama ' + DRIVE_TRIGGER_HANDLER + '.');
}

function removerAcionadoresDrive196A() {
  var triggers = ScriptApp.getProjectTriggers();
  var removidos = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === DRIVE_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(triggers[i]);
      removidos++;
    }
  }
  if (removidos) {
    Logger.log('[196A Drive] acionadores removidos: ' + removidos);
  }
  notificar196A_(removidos ? ('Removidos ' + removidos + ' acionador(es).') : 'Nenhum acionador Drive encontrado.');
}

function obterPlanilha196A_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  throw new Error('Planilha não encontrada. Rode o script ligado à planilha ou defina SPREADSHEET_ID.');
}

function obterPastaEntrada196A_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(DRIVE_FOLDER_ID_PROP);
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      Logger.log('[196A Drive] DRIVE_FOLDER_ID inválido, buscando pelo nome.');
    }
  }

  var it = DriveApp.getFoldersByName(DRIVE_PASTA_NOME);
  if (it.hasNext()) {
    var encontrada = it.next();
    props.setProperty(DRIVE_FOLDER_ID_PROP, encontrada.getId());
    return encontrada;
  }

  var criada = DriveApp.createFolder(DRIVE_PASTA_NOME);
  obterOuCriarSubpasta196A_(criada, DRIVE_SUBPASTA_ERRO);
  props.setProperty(DRIVE_FOLDER_ID_PROP, criada.getId());
  Logger.log('[196A Drive] pasta criada: ' + criada.getUrl());
  return criada;
}

function obterOuCriarSubpasta196A_(pasta, nome) {
  var it = pasta.getFoldersByName(nome);
  if (it.hasNext()) return it.next();
  return pasta.createFolder(nome);
}

function listarCsvsNaRaiz196A_(pasta) {
  var lista = [];
  var files = pasta.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (isCsv196A_(file)) lista.push(file);
  }
  lista.sort(function (a, b) {
    return a.getDateCreated().getTime() - b.getDateCreated().getTime();
  });
  return lista;
}

function isCsv196A_(file) {
  var name = (file.getName() || '').toLowerCase();
  var mime = file.getMimeType();
  if (mime === MimeType.GOOGLE_SHEETS) return false;
  return (
    name.indexOf('.csv') !== -1 ||
    mime === MimeType.CSV ||
    mime === 'text/csv' ||
    mime === 'text/plain'
  );
}

function lerCsv196A_(file) {
  var blob = file.getBlob();
  var encodings = ['ISO-8859-1', 'UTF-8'];
  var ultimoErro = 'CSV vazio';

  for (var i = 0; i < encodings.length; i++) {
    var text = blob.getDataAsString(encodings[i]);
    if (!text) continue;
    if (text.charCodeAt(0) === 0xfeff) text = text.substring(1);
    var delim = detectarDelimitador196A_(text);
    var rows = Utilities.parseCsv(text, delim);
    if (!rows || !rows.length) {
      ultimoErro = 'CSV sem linhas (' + encodings[i] + ')';
      continue;
    }
    if (encontrarLinhaCabecalhoMatriz196A_(rows) !== null) {
      return normalizarMatriz196A_(rows);
    }
    ultimoErro = 'Cabeçalho Crédito/Vencimento não encontrado (' + encodings[i] + ')';
  }

  throw new Error(ultimoErro);
}

function detectarDelimitador196A_(text) {
  var first = (text.split(/\r?\n/)[0] || '');
  var semi = (first.match(/;/g) || []).length;
  var comma = (first.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

function encontrarLinhaCabecalhoMatriz196A_(rows) {
  var limite = Math.min(rows.length, 50);
  for (var i = 0; i < limite; i++) {
    var temCredito = false;
    var temVencimento = false;
    var temDescricao = false;
    var temValor = false;
    var linha = rows[i] || [];
    for (var j = 0; j < linha.length; j++) {
      var cel = normalizarTexto(linha[j]);
      if (!cel) continue;
      if (cel.indexOf('credito') !== -1) temCredito = true;
      if (cel.indexOf('vencimento') !== -1) temVencimento = true;
      if (cel.indexOf('descricao') !== -1) temDescricao = true;
      if (cel === 'valor' || cel.indexOf('valor') !== -1) temValor = true;
    }
    if (temCredito && temVencimento && (temDescricao || temValor)) {
      return i;
    }
  }
  return null;
}

function validarCsv196A_(rows) {
  if (encontrarLinhaCabecalhoMatriz196A_(rows) === null) {
    throw new Error('CSV sem cabeçalho Crédito / Vencimento.');
  }
}

function normalizarMatriz196A_(rows) {
  var cols = 0;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].length > cols) cols = rows[i].length;
  }
  var out = [];
  for (var r = 0; r < rows.length; r++) {
    var line = (rows[r] || []).slice();
    while (line.length < cols) line.push('');
    out.push(line);
  }
  return out;
}

function escreverAbaOrigem196A_(ss, rows) {
  var aba = obterAbaOrigem(ss);
  if (!aba) {
    aba = ss.insertSheet('196A');
  }

  var cols = rows[0].length;
  aba.clearContents();
  aba.getRange(1, 1, rows.length, cols).setValues(rows);
}

function moverParaErro196A_(file, pastaRaiz, pastaErro) {
  try {
    file.moveTo(pastaErro);
    return;
  } catch (e) {
    pastaErro.addFile(file);
    pastaRaiz.removeFile(file);
  }
}

function montarResumo196A_(resumo) {
  var linhas = [
    'Importação Drive 196A',
    '',
    'Sucesso: ' + resumo.ok,
    'Erro (pasta ' + DRIVE_SUBPASTA_ERRO + '): ' + resumo.erro
  ];
  if (resumo.mensagens.length) {
    linhas.push('');
    linhas = linhas.concat(resumo.mensagens);
  }
  return linhas.join('\n');
}

function notificar196A_(msg) {
  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // Acionador não tem UI.
  }
}
