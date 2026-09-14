# CEMA — Controlle (Taxa Adm CSV → entrada)

Sync do CSV **196A** (crawler local em `output/`) para lançamentos de **entrada** no Controlle:

- Categoria **3.1.12**
- Centro de custo **Intermediação**

O CSV no Drive pode ir para a lixeira após o Apps Script — este serviço lê só o arquivo **local**.

## Setup

```bash
cd integrations/controlle
cp .env.example .env
# Cole CONTROLLE_API_TOKEN (um único Bearer)
npm install
```

## Fluxo de teste (ordem)

```bash
# 1) Descobrir IDs (categoria / centro / conta)
npm run resolve-ids

# 2) Dry-run / preview (NÃO envia — mostra valores e payload)
npm run post:dry -- --csv ../superlogica-crawler/output/SEU_ARQUIVO.csv
npm run post:dry -- --csv ../superlogica-crawler/output/SEU_ARQUIVO.csv --samples 5

# 3) Um POST real (validar na UI Controlle)
npm run post:one -- --csv ../superlogica-crawler/output/SEU_ARQUIVO.csv --index 0

# 4) Lote (após validar o one)
npm run sync:csv -- --csv ../superlogica-crawler/output/SEU_ARQUIVO.csv
```

## Auth

Header: `Authorization: Bearer <CONTROLLE_API_TOKEN>`

## Regras v1

- Só linhas com `valor > 0`
- Entrada única paga se houver data de crédito
- Idempotência em `.data/sync-store.json` (gitignored)
- Não recria lançamento se a chave já existir no store

## Ordem no job diário (fase 2)

```
crawl → CSV local → sync:csv (Controlle) → upload Drive → Sheets
```
