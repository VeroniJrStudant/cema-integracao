var PREFIXO_ABA_ORIGEM = "196A";
var LINHA_INICIO_DESTINO = 2; // Página1 e demais abas destino: dados a partir da linha 2
var LINHA_INICIO_ORIGEM = 6;  // Aba 196A: preserva cabeçalho do relatório (linhas 1-5)

function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Automações Privadas')
    .addItem('🧹 Limpar Aba Destino', 'limparPlanilha')
    .addItem('📄 Extrair Contratos', 'executarExtracao')
    .addToUi();
}

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

function obterAbaOrigem(ss) {
  var abas = ss.getSheets();
  for (var i = 0; i < abas.length; i++) {
    if (isAbaOrigem(abas[i])) {
      return abas[i];
    }
  }
  return null;
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

function limparAba(aba) {
  var linhaInicio = obterLinhaInicioLimpeza(aba);
  var ultimaLinha = aba.getLastRow();

  if (ultimaLinha < linhaInicio) return false;

  var linhasParaLimpar = ultimaLinha - linhaInicio + 1;

  if (isAbaOrigem(aba)) {
    // Aba 196A: limpa dados do relatório (Crédito, Vencimento, Descrição, Valor)
    aba.getRange(linhaInicio, 1, linhasParaLimpar, 4).clearContent();
    Logger.log("Aba 196A limpa a partir da linha " + linhaInicio + ": " + aba.getName());
  } else {
    // Aba destino (ex: Página1): limpa colunas de importação
    aba.getRange(linhaInicio, 1, linhasParaLimpar, 3).clearContent();
    aba.getRange(linhaInicio, 4, linhasParaLimpar, 2).clearContent();
    aba.getRange(linhaInicio, 8, linhasParaLimpar, 1).clearContent();
    aba.getRange(linhaInicio, 11, linhasParaLimpar, 1).clearContent();
    Logger.log("Aba destino limpa a partir da linha " + linhaInicio + ": " + aba.getName());
  }

  return true;
}

function limparPlanilha() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
      '(Linha 1 = cabeçalho preservado.)'
    );
  }
}

function executarExtracao() {
  Logger.log("=== INÍCIO DA EXECUÇÃO DA EXTRAÇÃO ===");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaDestino = ss.getActiveSheet();
  var abaOrigem = obterAbaOrigem(ss);

  if (!abaOrigem) {
    SpreadsheetApp.getUi().alert('⚠️ Aba de origem 196A não encontrada nesta planilha.');
    return;
  }

  if (isAbaOrigem(abaDestino)) {
    SpreadsheetApp.getUi().alert(
      '⚠️ Você está na aba 196A (origem).\n\n' +
      'Selecione a aba de DESTINO e execute novamente.'
    );
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

  var colunaA_Destino = [];
  var colunaB_Destino = [];
  var colunaC_Destino = [];
  var colunaD_Destino = [];
  var colunaE_Destino = [];
  var colunaH_Destino = [];
  var colunaK_Destino = [];

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
    colunaH_Destino.push(["santander"]);
    colunaK_Destino.push(["locacao"]);
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
    abaDestino.getRange(linhaGravacao, 1, totalLinhasInseridas, 1).setValues(colunaA_Destino);
    abaDestino.getRange(linhaGravacao, 2, totalLinhasInseridas, 1).setValues(colunaB_Destino);
    abaDestino.getRange(linhaGravacao, 3, totalLinhasInseridas, 1).setValues(colunaC_Destino);
    abaDestino.getRange(linhaGravacao, 4, totalLinhasInseridas, 1).setValues(colunaD_Destino);
    abaDestino.getRange(linhaGravacao, 5, totalLinhasInseridas, 1).setValues(colunaE_Destino);
    abaDestino.getRange(linhaGravacao, 8, totalLinhasInseridas, 1).setValues(colunaH_Destino);
    abaDestino.getRange(linhaGravacao, 11, totalLinhasInseridas, 1).setValues(colunaK_Destino);
  } catch (erroGrava) {
    Logger.log("ERRO NA GRAVAÇÃO: " + erroGrava.toString());
    SpreadsheetApp.getUi().alert('⚠️ Erro na gravação: ' + erroGrava.toString());
    return;
  }

  Logger.log("=== FIM DA EXECUÇÃO ===");
  SpreadsheetApp.getUi().alert(
    '✅ Processo concluído!\n\n' +
    totalLinhasInseridas + ' linhas importadas.\n' +
    contratosEncontradosContador + ' contratos formatados.\n\n' +
    'Origem: ' + abaOrigem.getName() + '\n' +
    'Destino: ' + abaDestino.getName()
  );
}
