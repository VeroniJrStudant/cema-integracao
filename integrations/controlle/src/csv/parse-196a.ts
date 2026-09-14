import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export type Csv196aRow = {
  index: number;
  credito: string;
  vencimento: string;
  descricao: string;
  valorRaw: string;
  valorCentavos: number;
  numeroContrato: string;
  chave: string;
};

function normalizeHeader(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function detectDelimiter(firstLine: string): ',' | ';' {
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

/** Parse CSV line respecting quotes. */
function splitCsvLine(line: string, delim: ',' | ';'): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsvMatrix(text: string): string[][] {
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = cleaned.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]);
  return lines.map((l) => splitCsvLine(l, delim));
}

function findHeaderRow(rows: string[][]): number {
  const limite = Math.min(rows.length, 50);
  for (let i = 0; i < limite; i++) {
    let temCredito = false;
    let temVencimento = false;
    let temDescricao = false;
    let temValor = false;
    for (const cell of rows[i] || []) {
      const cel = normalizeHeader(cell || '');
      if (!cel) continue;
      if (cel.includes('credito')) temCredito = true;
      if (cel.includes('vencimento')) temVencimento = true;
      if (cel.includes('descricao')) temDescricao = true;
      if (cel === 'valor' || cel.includes('valor')) temValor = true;
    }
    if (temCredito && temVencimento && (temDescricao || temValor)) return i;
  }
  return -1;
}

function colIndex(headers: string[], pred: (h: string) => boolean): number {
  for (let i = 0; i < headers.length; i++) {
    if (pred(normalizeHeader(headers[i] || ''))) return i;
  }
  return -1;
}

/** "320,000000" ou "320,00" → centavos */
export function valorBrToCentavos(raw: string): number {
  let s = String(raw || '').trim().replace(/\s/g, '');
  if (!s) return 0;
  // remove milhares . and use , as decimal
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function extractContrato(descricao: string): string {
  const m = String(descricao || '').match(/Contrato(?:\s*n[º°.]*)?\s*(\d{2,6})/i);
  return m?.[1] ? m[1] : '';
}

export function makeChave(row: {
  credito: string;
  vencimento: string;
  descricao: string;
  valorCentavos: number;
}): string {
  const base = [
    row.credito.trim(),
    row.vencimento.trim(),
    row.descricao.trim(),
    String(row.valorCentavos),
  ].join('|');
  return createHash('sha256').update(base).digest('hex').slice(0, 32);
}

function readTextWithFallback(filePath: string): string {
  const buf = readFileSync(filePath);
  // try utf-8 then latin1
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('\uFFFD') && findHeaderRow(parseCsvMatrix(utf8)) >= 0) {
    return utf8;
  }
  const latin1 = buf.toString('latin1');
  return latin1;
}

export function parseCsv196a(filePath: string): Csv196aRow[] {
  const text = readTextWithFallback(filePath);
  const matrix = parseCsvMatrix(text);
  const headerIdx = findHeaderRow(matrix);
  if (headerIdx < 0) {
    throw new Error('CSV sem cabeçalho Crédito / Vencimento / Descrição / Valor');
  }

  const headers = matrix[headerIdx];
  const iCred = colIndex(headers, (h) => h.includes('credito'));
  const iVenc = colIndex(headers, (h) => h.includes('vencimento'));
  const iDesc = colIndex(headers, (h) => h.includes('descricao'));
  const iValor = colIndex(headers, (h) => h === 'valor' || h.includes('valor'));

  if (iCred < 0 || iVenc < 0) {
    throw new Error('Colunas Crédito e Vencimento não identificadas no CSV');
  }

  const rows: Csv196aRow[] = [];
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const line = matrix[r] || [];
    const credito = String(line[iCred] ?? '').trim();
    const vencimento = String(line[iVenc] ?? '').trim();
    const descricao = iDesc >= 0 ? String(line[iDesc] ?? '').trim() : '';
    const valorRaw = iValor >= 0 ? String(line[iValor] ?? '').trim() : '';

    if (!credito && !vencimento && !descricao && !valorRaw) continue;
    const descNorm = normalizeHeader(descricao);
    if (descNorm.includes('cema consultoria')) continue;
    if (descNorm.includes('movimentacoes de taxa')) continue;
    if (descNorm.includes('conta categoria')) continue;
    if (normalizeHeader(credito).includes('credito') && normalizeHeader(vencimento).includes('vencimento')) {
      continue;
    }

    const valorCentavos = valorBrToCentavos(valorRaw);
    const numeroContrato = extractContrato(descricao);
    const chave = makeChave({ credito, vencimento, descricao, valorCentavos });

    rows.push({
      index: rows.length,
      credito,
      vencimento,
      descricao,
      valorRaw,
      valorCentavos,
      numeroContrato,
      chave,
    });
  }

  return rows;
}

export function rowsElegiveis(rows: Csv196aRow[]): Csv196aRow[] {
  return rows.filter((r) => r.valorCentavos > 0);
}
