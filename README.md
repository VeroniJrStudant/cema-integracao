# CEMA — Integrações Superlógica × Sheets × Controlle

Monorepo da Cema para automações financeiras:

1. **Superlógica → Google Sheets** — importação via Apps Script (implementado)
2. **Planilha 196A** — extração local de contratos (implementado)
3. **Superlógica → Controlle** — sync futuro (desenvolvimento arquitetural)

| Área | Pasta | Status |
|------|--------|--------|
| Superlógica → Sheets (analítico) | `integrations/superlogica/src/` | Implementado |
| Superlógica → Sheets (exemplo) | `integrations/superlogica/examples/` | Implementado |
| Extração contratos 196A | `integrations/google-sheets-automacao/` | Implementado |
| Superlógica → Controlle | `integrations/controlle/` | Desenvolvimento arquitetural |

---

## Estrutura

```
cema-integracao/
├── integrations/
│   ├── superlogica/
│   │   ├── src/superlogica-cobrancas-analitico.gs
│   │   ├── examples/superlogica-cobrancas.gs
│   │   └── schemas/                          # OpenAPI + amostras anonimizadas
│   ├── google-sheets-automacao/
│   │   └── src/extracao-contratos-196a.gs
│   └── controlle/                            # futuro sync (só arquitetura + README)
├── docs/                                     # planejamento Controlle (HTML + PDF)
├── diagrams/fluxo-integracao.drawio
├── backup/                                   # LOCAL — tokens (gitignored)
├── .env.example
└── .gitignore
```

Documentação de planejamento: [`docs/README.md`](docs/README.md).

---

## 1. Superlógica → Google Sheets

API: [Superlógica Imobiliárias](https://apps.superlogica.net/imobiliaria/api)  
Base: `https://apps.superlogica.net/imobiliaria/api`  
Auth: headers `app_token` e `access_token` (Script Properties).

### Script principal — analítico

| | |
|--|--|
| **Arquivo** | `integrations/superlogica/src/superlogica-cobrancas-analitico.gs` |
| **Menu** | `Superlógica Analítico` |

| Menu | Função |
|------|--------|
| Importar tudo | Cobranças + contratos + taxa adm + resumo |
| Importar por período | Idem, com filtro `DD/MM/AAAA` |
| Importar contratos (cadastro taxa) | Só taxa administrativa cadastrada |
| Configurar Tokens | Salva `APP_TOKEN` / `ACCESS_TOKEN` |
| Testar API (1 página) | Smoke test |

**Abas**

| Aba | Conteúdo |
|-----|----------|
| `Recebimentos` | Cobranças (schema filtrado) |
| `Composição` | Itens de `compo_recebimento` |
| `Contratos` | Taxa adm cadastrada no contrato |
| `Taxa Adm Realizada` | Fontes: repasse · composição · despesa |
| `Resumo Analítico` | Totais |
| `Log Importação` | Histórico de execuções |

**Endpoints:** `GET /cobrancas` · `GET /contratos` · `GET /despesas` · `GET /repasses?idContrato=`

### Exemplo simples

| | |
|--|--|
| **Arquivo** | `integrations/superlogica/examples/superlogica-cobrancas.gs` |
| **Menu** | `Superlógica` |

Importa cobranças + composição + resumo + log (sem contratos/despesas/repasses).

### Setup (Apps Script)

1. Abra a planilha no Google Sheets.
2. **Extensões → Apps Script** e cole o `.gs`.
3. Defina `CONFIG.SPREADSHEET_ID` (ID da URL entre `/d/` e `/edit`).
4. Salve, recarregue a planilha e use o menu.
5. **Configurar Tokens** → `app_token` e `access_token`.
6. **Testar API** (opcional) → **Importar por período** ou **Importar tudo**.

### Schemas

Pasta `integrations/superlogica/schemas/`:

| Arquivo | Uso |
|---------|-----|
| `superlogica-imobiliarias-api.json` | OpenAPI (contratos, imóveis, encargos, etc.) |
| `ex-schema.json` | Campos escalares das cobranças |
| `schema-sheets.json` | Mapeamento para abas do Sheets |
| Demais `*.json` | Amostras **anonimizadas** (`0` / `XXX` / `dd/mm/aaaa`) |

---

## 2. Extração de contratos (196A)

| | |
|--|--|
| **Arquivo** | `integrations/google-sheets-automacao/src/extracao-contratos-196a.gs` |
| **Menu** | `⚙️ Automações Privadas` |

Sem chamada à API Superlógica — só manipulação de abas.

| Menu | Ação |
|------|------|
| Extrair Contratos | Lê aba com `196A` no nome → grava na aba ativa |
| Limpar Aba Destino | Limpa colunas usadas na aba ativa |

Detecta Crédito / Vencimento / Descrição / Valor, extrai `Contrato {n}` e escreve no destino.  
Independente do sync Controlle e **fora** do escopo da v1 Controlle.

---

## 3. Superlógica → Controlle (arquitetura)

| | |
|--|--|
| **Pasta** | `integrations/controlle/` |
| **Status** | Desenvolvimento arquitetural — sem código de sync |

Objetivo: enviar despesas/parcelas de contrato (aluguel e compra) do Superlógica para entradas no Controlle, vinculadas por `Contrato N`.

| Item | Decisão |
|------|---------|
| Direção v1 | Superlógica → Controlle |
| Vínculo | Número do contrato |
| Retorno de pagamento | Opcional |
| Stack sugerida | Node.js + TypeScript, polling 15–60 min, store de IDs |

**Documentação**

- Índice: [`docs/README.md`](docs/README.md)
- HTML: [`docs/html/planejamento-superlogica-controlle.html`](docs/html/planejamento-superlogica-controlle.html)
- PDF: [`docs/pdf/planejamento-superlogica-controlle.pdf`](docs/pdf/planejamento-superlogica-controlle.pdf)
- Diagrama: [`diagrams/fluxo-integracao.drawio`](diagrams/fluxo-integracao.drawio)
- Notas da pasta: [`integrations/controlle/README.md`](integrations/controlle/README.md)

Implementação futura deve nascer **apenas** em `integrations/controlle/`.

---

## Segurança

**Nunca** versionar tokens reais.

| Dado | Onde fica |
|------|-----------|
| `APP_TOKEN` / `ACCESS_TOKEN` | Script Properties (menu **Configurar Tokens**) |
| `SPREADSHEET_ID` | `CONFIG` no projeto Apps Script |
| Cópias locais | `backup/` (gitignored) |

- `.gitignore` — `backup/`, `.env`, `secrets/`, `*.local`, etc.
- `.env.example` — modelo sem valores reais (Apps Script não usa `.env`)

Antes do push: `git status` e confirme que `backup/` não aparece.  
Se tokens vazaram: rotacione na Superlógica e atualize as Script Properties.

---

## Visão dos fluxos

```
Superlógica API  ──Apps Script──►  Google Sheets (analítico)     [implementado]
Aba 196A         ──.gs local───►  Aba destino                    [implementado]
Superlógica      - - sync - - ►  Controlle                       [arquitetura]
```
