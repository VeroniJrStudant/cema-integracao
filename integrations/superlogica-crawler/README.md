# Superlógica Crawler (Playwright)

Login no **Superlógica Imobiliárias** + relatório **196A** + publicação do CSV no Drive.

| | |
|--|--|
| **Fase A (Opção 1)** | Em operação — crawl local → Drive → Sheets |
| **Fase B (Opção 2)** | GitHub Actions dia 01 — **após GO do cliente** |
| **Fonte de verdade** | [`docs/196a-integracao/documentacao-196a-integracao.md`](../../docs/196a-integracao/documentacao-196a-integracao.md) |

---

## Fluxo operacional (Fase A)

1. Login + MFA  
2. Empresa → Relatórios → Banco → **196A**  
3. Vencimento → **Mês anterior**  
4. Categoria → **1.1.1 Taxa de administração**  
5. DETALHAR → **Detalhado**  
6. Exportar CSV → `output/`  
7. Se `DRIVE_UPLOAD=true` → envia para a pasta Shared Drive  

Depois: Apps Script importa para `196A*`  
→ ver [`../google-sheets-automacao/README.md`](../google-sheets-automacao/README.md)

---

## Comandos

```bash
cd integrations/superlogica-crawler
PLAYWRIGHT_HEADED=true npm run crawl
```

Upload avulso:

```bash
npm run drive:upload -- output/arquivo.csv
```

Sessão: `.auth/storage-state.json`  
CSV / screenshots: `output/`  
Service account Drive: `.auth/google-sa.json` (**não versionar**)

---

## Drive (resumo)

- Pasta: `196a-automacao-superlogica-controller` (**Unidade compartilhada**)  
- Motivo Shared Drive: service account sem cota no Meu Drive  
- Variáveis: `DRIVE_FOLDER_ID`, `DRIVE_UPLOAD=true`, `GOOGLE_APPLICATION_CREDENTIALS`

---

## Tasks relacionadas (Nauck)

| Agora | Depois (blocked) |
|-------|------------------|
| Operação mensal / runbook (T17, T19) | T7 headless CI |
| GO do cliente (T20) | T11–T16 Docker + cron dia 01 |

Não iniciar workflow GitHub Actions sem liberação da task **T20**.

---

## Entrada web

```
https://apps.superlogica.net/imobiliaria
```

HTML consolidado: [`docs/html/documentacao-cema-integracao.html`](../../docs/html/documentacao-cema-integracao.html)
