# Documentação CEMA Integração

Índice da pasta `docs/`.  
Metodologia: **Pedro Nauck / CompozyOS** — Idea → TechSpec → Tasks → ADRs  
([referencia-pedro-nauk.md](./referencia-pedro-nauk.md))

---

## Fonte de verdade por tema

| Tema | Artefato | Conteúdo |
|------|----------|----------|
| **196A** (Opção 1 + 2) | [`196a-integracao/documentacao-196a-integracao.md`](./196a-integracao/documentacao-196a-integracao.md) | PRD · TechSpec · **Tasks** · ADRs |
| Leitura HTML unificada | [`html/documentacao-cema-integracao.html`](./html/documentacao-cema-integracao.html) | Nauck + Crawler + Sheets + Controlle |
| Metodologia | [`referencia-pedro-nauk.md`](./referencia-pedro-nauk.md) | CompozyOS / pipeline |

### Status 196A (atalho)

| Fase | O quê | Status |
|------|--------|--------|
| **A** | CSV → Drive → Acionador Sheets | **Em operação** |
| **B** | GitHub Actions dia 01 | **Blocked** — aguarda avaliação do cliente |

Tasks a fazer agora: **T10, T17, T18, T19, T20** (ver doc 196A).  
Tasks Fase B: **T7, T11–T16** (não implementar até GO).

---

## Operação (READMEs das integrações)

| README | Uso |
|--------|-----|
| [../README.md](../README.md) | Índice do repositório |
| [../integrations/superlogica-crawler/README.md](../integrations/superlogica-crawler/README.md) | Crawler + upload Drive |
| [../integrations/google-sheets-automacao/README.md](../integrations/google-sheets-automacao/README.md) | Import Drive + extrair contratos |
| [../integrations/superlogica/](../integrations/superlogica/) | API → abas analíticas (`*.gs` em `src/`) |

---

## Servir o HTML localmente

```bash
cd docs
python3 -m http.server 8765
```

- http://127.0.0.1:8765/html/documentacao-cema-integracao.html

---

## PDFs

| PDF | Conteúdo |
|-----|----------|
| [documentacao-196a-integracao.pdf](./pdf/documentacao-196a-integracao.pdf) | PRD · TechSpec · ADRs (atual) |
| [tarefas-196a-integracao.pdf](./pdf/tarefas-196a-integracao.pdf) | Passos detalhados T0–T20 |
| [planejamento-crawler-superlogica.pdf](./pdf/planejamento-crawler-superlogica.pdf) | Histórico — decisão de stack |
| [guia-superlogica-sheets.pdf](./pdf/guia-superlogica-sheets.pdf) | Histórico — guia Sheets |
| [planejamento-superlogica-controlle.pdf](./pdf/planejamento-superlogica-controlle.pdf) | Histórico — Controlle |
| [api.pdf](./pdf/api.pdf) | Histórico — API |

Regenerar os PDFs 196A:

```bash
node docs/scripts/gerar-pdfs-196a.mjs
```

> Fonte de verdade editável: **Markdown** em `196a-integracao/`. Os dois PDFs 196A saem de `docs/html/*-196a-pdf.html`.
