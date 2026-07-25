# CEMA — Integrações Superlógica × Google Sheets × Controlle

Documento único do repositório. Use o sumário para ir direto ao assunto.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Estrutura do repositório](#2-estrutura-do-repositório)
3. [Superlógica → Google Sheets](#3-superlógica--google-sheets)
4. [Extração 196A](#4-extração-196a)
5. [Superlógica → Controlle](#5-superlógica--controlle)
6. [Schemas e amostras](#6-schemas-e-amostras)
7. [Guias HTML e PDF](#7-guias-html-e-pdf)
8. [Segurança](#8-segurança)
9. [Para novos desenvolvedores](#9-para-novos-desenvolvedores)

---

## 1. Visão geral

| Fluxo | Pasta | Status |
|-------|--------|--------|
| Superlógica → Google Sheets (analítico) | [`integrations/superlogica/`](integrations/superlogica/) | **Implementado** |
| Extração de contratos da aba 196A | [`integrations/google-sheets-automacao/`](integrations/google-sheets-automacao/) | **Implementado** |
| Superlógica → Controlle | [`integrations/controlle/`](integrations/controlle/) | Arquitetura (sem código de sync) |

```
Superlógica API  ── Apps Script ──►  Google Sheets (analítico)     [implementado]
Aba 196A         ── Apps Script ──►  Aba destino                   [implementado]
Superlógica      - - sync - - - ►  Controlle                       [arquitetura]
```

---

## 2. Estrutura do repositório

```
cema-integracao/
├── README.md                          ← documentação única
├── .env.example                       ← modelo de tokens (não versionar .env)
├── diagrams/                          ← diagramas Draw.io
├── docs/
│   ├── html/                          ← guias navegáveis
│   └── pdf/                           ← mesmos guias em PDF
└── integrations/
    ├── superlogica/                   ← import analítico (principal)
    │   ├── src/                       ← script Apps Script de produção
    │   ├── examples/                  ← exemplos e versões anteriores
    │   └── schemas/                   ← OpenAPI + amostras anonimizadas
    ├── google-sheets-automacao/       ← extração 196A
    └── controlle/                     ← destino futuro do sync Controlle
```

---

## 3. Superlógica → Google Sheets

Importa cobranças, contratos e **Taxa Adm Realizada** (via `/repasses`) para Google Sheets.

| Item | Valor |
|------|--------|
| Script de produção | [`integrations/superlogica/src/superlogica-cobrancas-analitico.gs`](integrations/superlogica/src/superlogica-cobrancas-analitico.gs) |
| Exemplo simples | [`integrations/superlogica/examples/superlogica-cobrancas.gs`](integrations/superlogica/examples/superlogica-cobrancas.gs) |
| Menu na planilha | **Superlógica Analítico** |
| Guia detalhado | [HTML](docs/html/guia-superlogica-sheets.html) · [PDF](docs/pdf/guia-superlogica-sheets.pdf) |

### Menu do script principal

| Item | Ação |
|------|------|
| Importar tudo | Cobranças + contratos + repasses + resumo |
| Importar por período | Idem, com `DD/MM/AAAA`–`DD/MM/AAAA` |
| Importar contratos | Só cadastro de taxa adm |
| Configurar Tokens | Grava `APP_TOKEN` / `ACCESS_TOKEN` |
| Testar API | Smoke test (1 página) |

### Abas geradas

| Aba | Conteúdo |
|-----|----------|
| Recebimentos | Cobranças (schema filtrado) |
| Composição | Itens de `compo_recebimento` |
| Contratos | Cadastro de taxa adm + `contrato_ativo` |
| Taxa Adm Realizada | Linhas de taxa (fonte principal: **repasse**) |
| Resumo Analítico | Totais, ativos × inativos, por fonte |
| Log Importação | Histórico de execuções |

### Endpoints

`GET /cobrancas` · `GET /contratos` · `GET /repasses?idContrato=` · (opcional) `GET /despesas`

### Setup rápido

1. Abra a planilha → **Extensões → Apps Script**.
2. Cole o conteúdo de `superlogica-cobrancas-analitico.gs`.
3. Ajuste `CONFIG.SPREADSHEET_ID` (ID na URL entre `/d/` e `/edit`).
4. Salve, recarregue a planilha.
5. Menu **Configurar Tokens** → `app_token` / `access_token`.
6. **Testar API** → **Importar por período**.

### Taxa Adm Realizada — regras essenciais

1. **Fonte:** `GET /repasses?idContrato=` (não usar PDF como dado).
2. **Ativos:** listagem `GET /contratos`.
3. **Inativos:** IDs das cobranças do período + `/contratos?pesquisa={número}` (gêmeos).
4. **Período no repasse:** `dt_credito_recb` **ou** `dt_repasse_rep` **ou** `dt_pagamento` (formato API `m/d/Y`).
5. **Paginação:** API limita ~50 itens/página — continuar enquanto a página vier cheia.
6. **Rateio:** uma linha por beneficiário (`proprietarios_beneficiarios`).
7. **Coluna `contrato_ativo`:** `Ativo` / `Inativo` (`fl_ativo_con`).

Conferência jun/2026 (API): ~351 só ativos · ~367 com inativos · PDF ouro 363 (validação externa).

### CONFIG relevantes

| Chave | Papel |
|-------|--------|
| `TAXA_ADM_SOMENTE_CONTRATOS_ATIVOS` | `false` = inclui IDs das cobranças (inativos) |
| `TAXA_ADM_PESQUISAR_CONTRATOS_INATIVOS` | `true` = pesquisa gêmeos por identificador |
| `REPASSES_ITENS_POR_PAGINA` | 50 (limite prático da API) |
| `TAXA_ADM_INCLUIR_COMPOSICAO` / `…_DESPESAS` | Desligados por padrão |

---

## 4. Extração 196A

Script local (sem API Superlógica) que lê uma aba com `196A` no nome e extrai contratos para a aba ativa.

| Item | Valor |
|------|--------|
| Arquivo | [`integrations/google-sheets-automacao/src/extracao-contratos-196a.gs`](integrations/google-sheets-automacao/src/extracao-contratos-196a.gs) |
| Menu | **⚙️ Automações Privadas** |

Independente do sync Controlle e do import analítico.

---

## 5. Superlógica → Controlle

Fase **arquitetural**: pasta [`integrations/controlle/`](integrations/controlle/) ainda **sem código de sync**.

| Item | Valor |
|------|--------|
| Planejamento | [HTML](docs/html/planejamento-superlogica-controlle.html) · [PDF](docs/pdf/planejamento-superlogica-controlle.pdf) |
| Diagrama | [`diagrams/fluxo-integracao.drawio`](diagrams/fluxo-integracao.drawio) |

### Escopo planejado (v1)

| Item | Decisão |
|------|---------|
| Origem | Superlógica (despesas/parcelas — aluguel e compra) |
| Destino | Controlle (lançamentos de entrada) |
| Vínculo | Número do contrato (`Contrato N`) |
| Idempotência | Store de IDs (despesa ↔ lançamento) |
| Stack sugerida | Node.js + TypeScript, polling 15–60 min |

### Próximos passos (antes de codar)

1. Validar payloads (listar despesas Superlógica + criar entrada Controlle).
2. Fechar IDs de conta/categorias no Controlle.
3. Congelar regra de match.
4. Decidir se o retorno de pagamento entra na v1.
5. Só então implementar em `integrations/controlle/`, sob pedido explícito.

---

## 6. Schemas e amostras

Pasta: [`integrations/superlogica/schemas/`](integrations/superlogica/schemas/)

Valores sensíveis anonimizados (`XXX`, `0`, `dd/mm/aaaa`).  
**Não** versionar dumps brutos da API.

### Referência

| Arquivo | Descrição |
|---------|-----------|
| `superlogica-imobiliarias-api.json` | OpenAPI Superlógica Imobiliárias |
| `ex-schema.json` | Campos escalares de cobranças (aba Recebimentos) |
| `schema-sheets.json` | Mapeamento conceitual → abas do Sheets |

### Exemplos anonimizados

| Arquivo | Descrição |
|---------|-----------|
| `repasse-exemplo.json` | Payload de `/repasses` |
| `despesa-taxa-adm-exemplo.json` | Amostra de despesa com taxa adm |
| `composicao-taxa-adm-exemplo.json` | Linha sintética de composição |
| `contrato-taxa-adm-exemplo.json` | Campos de taxa adm no contrato |
| `contrato-post-schema-exemplo.json` | Exemplo de body POST/PUT |

---

## 7. Guias HTML e PDF

| Documento | HTML | PDF |
|-----------|------|-----|
| Superlógica → Sheets | [`docs/html/guia-superlogica-sheets.html`](docs/html/guia-superlogica-sheets.html) | [`docs/pdf/guia-superlogica-sheets.pdf`](docs/pdf/guia-superlogica-sheets.pdf) |
| Superlógica → Controlle | [`docs/html/planejamento-superlogica-controlle.html`](docs/html/planejamento-superlogica-controlle.html) | [`docs/pdf/planejamento-superlogica-controlle.pdf`](docs/pdf/planejamento-superlogica-controlle.pdf) |

Abra o HTML no navegador (diagramas Mermaid). Use o PDF para compartilhar ou imprimir.

### Regenerar PDFs (macOS + Chrome)

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/pdf/guia-superlogica-sheets.pdf" \
  "file://$(pwd)/docs/html/guia-superlogica-sheets.html"

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/pdf/planejamento-superlogica-controlle.pdf" \
  "file://$(pwd)/docs/html/planejamento-superlogica-controlle.html"
```

---

## 8. Segurança

**Nunca** versionar tokens reais.

| Dado | Onde fica |
|------|-----------|
| `APP_TOKEN` / `ACCESS_TOKEN` | Script Properties (menu **Configurar Tokens**) |
| `SPREADSHEET_ID` | `CONFIG` no Apps Script |
| Cópias locais | `backup/` e `.env` (**gitignored**) |

Antes do push: confira `git status`. Se tokens vazaram, rotacione na Superlógica.

---

## 9. Para novos desenvolvedores

1. Leia este README (sumário acima).
2. Para operar o import: [guia HTML](docs/html/guia-superlogica-sheets.html).
3. Para alterar colunas/API: pasta [`schemas/`](integrations/superlogica/schemas/).
4. Não reintroduza dumps brutos no Git.
5. Controlle: só documentação até haver pedido explícito de implementação.
