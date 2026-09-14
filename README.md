# CEMA — Integrações Superlógica × Google Sheets × Controlle

Índice do repositório. Detalhes operacionais e de planejamento ficam nos READMEs das pastas e em `docs/`.

**Metodologia:** Pedro Nauck / CompozyOS — Idea → TechSpec → Tasks → ADRs  
(ver [`docs/referencia-pedro-nauk.md`](docs/referencia-pedro-nauk.md))

---

## Sumário

1. [Visão e status](#1-visão-e-status)
2. [Mapa de documentação](#2-mapa-de-documentação)
3. [Estrutura do repositório](#3-estrutura-do-repositório)
4. [Fluxos por pasta](#4-fluxos-por-pasta)
5. [Segurança](#5-segurança)
6. [Para quem chega agora](#6-para-quem-chega-agora)

---

## 1. Visão e status

| Fluxo | Pasta | Status |
|-------|--------|--------|
| API → Sheets (Recebimentos, Taxa Adm, Resumo…) | [`integrations/superlogica/`](integrations/superlogica/) | **Implementado** (`app_token` / `access_token`) |
| 196A — Opção 1: CSV → Drive → Acionador | [`integrations/superlogica-crawler/`](integrations/superlogica-crawler/) + [`google-sheets-automacao/`](integrations/google-sheets-automacao/) | **Em operação** |
| 196A — Opção 2: GitHub Actions dia 01 | mesmo contrato Drive/Sheets | **Aguardando avaliação do cliente** |
| Superlógica → Controlle | [`integrations/controlle/`](integrations/controlle/) | Arquitetura (sem sync) |

```
Superlógica API     ── Apps Script ──►  Recebimentos / Taxa Adm / Resumo     [API]
Superlógica UI 196A ── CSV → Drive ──►  aba 196A* → Extrair Contratos       [Opção 1]
                         └── GH Actions dia 01 (mesmo Drive)                 [Opção 2 — pós GO]
```

**Não misturar:** tokens da API **não** geram o 196A; o CSV do 196A **não** alimenta Taxa Adm Realizada.

---

## 2. Mapa de documentação

| Onde | Para quê |
|------|----------|
| **Este README** | Índice do repo + status |
| [`docs/README.md`](docs/README.md) | Índice da pasta `docs/` |
| [`docs/196a-integracao/documentacao-196a-integracao.md`](docs/196a-integracao/documentacao-196a-integracao.md) | **Fonte de verdade 196A** — PRD · TechSpec · **Tasks** · ADRs |
| [`docs/html/documentacao-cema-integracao.html`](docs/html/documentacao-cema-integracao.html) | Leitura HTML consolidada (Nauck + Crawler + Sheets + Controlle) |
| [`docs/referencia-pedro-nauk.md`](docs/referencia-pedro-nauk.md) | Metodologia CompozyOS |
| [`integrations/superlogica-crawler/README.md`](integrations/superlogica-crawler/README.md) | Operar o crawler / upload Drive |
| [`integrations/google-sheets-automacao/README.md`](integrations/google-sheets-automacao/README.md) | Apps Script 196A + Drive |
| [`integrations/superlogica/`](integrations/superlogica/) | Script analítico (API) — ver seção 4 |

### Tasks 196A (resumo)

- **Agora (Fase A):** T10, T17–T20 — runbook, menus dual, GO do cliente  
- **Depois (Fase B, blocked):** T7, T11–T16 — GitHub Actions dia 01  

Detalhe e aceite: documento 196A acima.

---

## 3. Estrutura do repositório

```
cema-integracao/
├── README.md                          ← você está aqui (índice)
├── docs/
│   ├── README.md                      ← índice docs/
│   ├── 196a-integracao/               ← PRD · Spec · Tasks · ADRs
│   ├── html/                          ← documentação navegável
│   ├── pdf/                           ← histórico
│   └── referencia-pedro-nauk.md
└── integrations/
    ├── superlogica/                   ← API → Sheets
    ├── superlogica-crawler/           ← Playwright 196A + Drive
    ├── google-sheets-automacao/       ← import Drive + extrair contratos
    └── controlle/                     ← destino futuro
```

---

## 4. Fluxos por pasta

### 4.1 Superlógica Analítico (API)

| Item | Valor |
|------|--------|
| Script | [`integrations/superlogica/src/superlogica-cobrancas-analitico.gs`](integrations/superlogica/src/superlogica-cobrancas-analitico.gs) |
| Menu | **Superlógica Analítico** → Importar por período, tokens, etc. |
| Abas | Recebimentos · Composição · Contratos · Taxa Adm Realizada · Resumo · Log |

Setup: cole o `.gs` no Apps Script → Configurar Tokens (`app_token` / `access_token`) → Importar por período.  
Guia: [`docs/html/documentacao-cema-integracao.html`](docs/html/documentacao-cema-integracao.html) (seção Sheets).

### 4.2 196A (Opção 1 — em operação)

| Item | Valor |
|------|--------|
| Crawler | `cd integrations/superlogica-crawler && npm run crawl` |
| Upload | `npm run drive:upload -- output/arquivo.csv` (ou automático no crawl) |
| Pasta Drive | `196a-automacao-superlogica-controller` (Unidade compartilhada) |
| Sheets | menu **⚙️ Automações Privadas** + acionador 15 min |
| Doc / tasks | [`docs/196a-integracao/documentacao-196a-integracao.md`](docs/196a-integracao/documentacao-196a-integracao.md) |

No Apps Script: **dois** arquivos (analítico + 196A). Um só `onOpen` (no analítico).

### 4.3 196A (Opção 2 — após GO do cliente)

Mesma pasta Drive e mesmo Apps Script.  
Implementação: tasks **T11–T16** (status `blocked` até T20).  
**Não implementar** antes da avaliação do cliente.

### 4.4 Controlle

Fase arquitetural. Sem código de sync até pedido explícito.  
Planejamento no HTML consolidado / PDFs históricos em `docs/pdf/`.

---

## 5. Segurança

**Nunca** versionar tokens, `.env`, `google-sa.json`, `storage-state.json`.

| Dado | Onde fica |
|------|-----------|
| `APP_TOKEN` / `ACCESS_TOKEN` | Script Properties (menu Configurar Tokens) |
| Credenciais crawler / Drive SA | `.env` + `.auth/` (**gitignored**) |
| Cópias locais | `backup/` (**gitignored**) |

---

## 6. Para quem chega agora

1. Leia este índice e o status da seção 1.  
2. 196A: abra o [documento Nauck](docs/196a-integracao/documentacao-196a-integracao.md) — especialmente **Tasks**.  
3. Operar crawler / Drive: [README do crawler](integrations/superlogica-crawler/README.md).  
4. Operar import Sheets 196A: [README google-sheets-automacao](integrations/google-sheets-automacao/README.md).  
5. API / período: script em `integrations/superlogica/src/`.  
6. Não iniciar GitHub Actions sem GO do cliente (task T20).
