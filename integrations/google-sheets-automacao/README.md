# Extração 196A + importação Drive

Apps Script: importa CSV da pasta Drive → aba `196A*` → extrai contratos para a aba destino.

| | |
|--|--|
| **Fase A (Opção 1)** | **Em operação** — Acionador / menu |
| **Fase B (Opção 2)** | Mesmo import; só muda quem coloca o CSV (GH Actions) |
| **Fonte de verdade** | [`docs/196a-integracao/documentacao-196a-integracao.md`](../../docs/196a-integracao/documentacao-196a-integracao.md) |

---

## Dois scripts na mesma planilha

| Arquivo | Menu | Mundo |
|---------|------|--------|
| [`src/extracao-contratos-196a.gs`](src/extracao-contratos-196a.gs) | ⚙️ Automações Privadas | CSV / Drive / 196A |
| [`../superlogica/src/superlogica-cobrancas-analitico.gs`](../superlogica/src/superlogica-cobrancas-analitico.gs) | Superlógica Analítico | API `access_token` (Recebimentos, Taxa Adm, Resumo…) |

Cole **os dois** no Apps Script.  
O `onOpen` fica **só** no analítico (ele também cria o menu 196A).  
Dois `onOpen` → some o menu “Importar por período”.

---

## Pasta no Drive

```
196a-automacao-superlogica-controller/   ← Unidade compartilhada
  ├── (CSV aguardando import)
  └── execucoes-com-erro/
```

| Resultado | O que acontece |
|-----------|----------------|
| Sucesso | Preenche `196A*` e manda o CSV para a **lixeira** |
| Falha | Move para `execucoes-com-erro`; a aba **não** muda |

Não converter o CSV em Planilha Google no upload.

---

## Setup (Fase A)

1. Pasta Shared Drive + `DRIVE_FOLDER_ID` (Script Properties, opcional).  
2. Cole os dois `.gs` → Salvar → recarregar planilha.  
3. Autorizar Drive + Sheets na 1ª execução.  
4. Menu **Instalar acionador Drive (15 min)** (ou importar à mão).  
5. Conferir menus: **Superlógica Analítico** + **Automações Privadas**.

---

## Como o CSV chega

| Modo | Quem coloca o arquivo |
|------|------------------------|
| Semi-manual | Operador arrasta CSV |
| Crawler local | `npm run crawl` / `drive:upload` |
| Fase B (futuro) | GitHub Actions dia 01 — **após GO do cliente** |

Setup do crawler: [`../superlogica-crawler/README.md`](../superlogica-crawler/README.md)

---

## Tasks relacionadas (Nauck)

| ID | O quê | Status |
|----|--------|--------|
| T8 | Import Drive → `196A*` | done |
| T10 | Encadear / documentar Extrair Contratos | todo |
| T17 | Runbook operacional Fase A | todo |
| T18 | Garantir dois menus na planilha | todo |
| T20 | GO do cliente para Fase B | todo |
| T11–T16 | GitHub Actions | blocked |

---

## O que este fluxo **não** faz

- Não usa `access_token`  
- Não preenche Taxa Adm Realizada / Resumo / Recebimentos (isso é o script analítico)  
