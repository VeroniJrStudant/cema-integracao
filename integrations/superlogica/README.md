# Superlógica → Google Sheets (API)

Import analítico via **Apps Script** + tokens oficiais (`app_token` / `access_token`).

**Não é o fluxo 196A.** O 196A é CSV → Drive → outra aba; ver  
[`../google-sheets-automacao/README.md`](../google-sheets-automacao/README.md) e  
[`../../docs/196a-integracao/documentacao-196a-integracao.md`](../../docs/196a-integracao/documentacao-196a-integracao.md).

---

## Arquivo de produção

| Item | Valor |
|------|--------|
| Script | [`src/superlogica-cobrancas-analitico.gs`](src/superlogica-cobrancas-analitico.gs) |
| Menu | **Superlógica Analítico** |
| Exemplos | [`examples/`](examples/) |
| Schemas | [`schemas/`](schemas/) |

### Menu principal

| Item | Ação |
|------|------|
| Importar tudo | Cobranças + contratos + repasses + resumo |
| Importar por período | Idem, com intervalo de datas |
| Importar contratos | Cadastro de taxa adm |
| Configurar Tokens | Grava tokens nas Script Properties |
| Testar API | Smoke test |

### Abas

Recebimentos · Composição · Contratos · Taxa Adm Realizada · Resumo Analítico · Log Importação

---

## Setup

1. Planilha → **Extensões → Apps Script**.  
2. Cole `superlogica-cobrancas-analitico.gs`.  
3. Se usar 196A na mesma planilha, cole também `extracao-contratos-196a.gs` (sem segundo `onOpen`).  
4. Configurar Tokens → Testar API → Importar por período.

---

## Documentação

- Índice do repo: [`../../README.md`](../../README.md)  
- HTML consolidado (seção Sheets): [`../../docs/html/documentacao-cema-integracao.html`](../../docs/html/documentacao-cema-integracao.html)  
