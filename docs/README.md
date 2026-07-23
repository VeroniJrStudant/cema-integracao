# Documentação — CEMA

Documentos de planejamento da integração **Superlógica → Controlle**.  
O código dessa integração ainda **não existe**; a pasta alvo é `integrations/controlle/`.

## Conteúdo desta pasta

| Arquivo | Descrição |
|---------|-----------|
| [`html/planejamento-superlogica-controlle.html`](html/planejamento-superlogica-controlle.html) | Planejamento completo (navegável, com diagramas Mermaid) |
| [`pdf/planejamento-superlogica-controlle.pdf`](pdf/planejamento-superlogica-controlle.pdf) | Mesmo conteúdo em PDF (para compartilhar / imprimir) |

## Relacionados (fora de `docs/`)

| Arquivo | Descrição |
|---------|-----------|
| [`../diagrams/fluxo-integracao.drawio`](../diagrams/fluxo-integracao.drawio) | Diagrama editável (Draw.io / diagrams.net) |
| [`../integrations/controlle/README.md`](../integrations/controlle/README.md) | Status da pasta de implementação futura |
| [`../README.md`](../README.md) | Visão geral do monorepo |

## Status do Controlle

**Fase:** desenvolvimento arquitetural  

- Direção v1: Superlógica → Controlle (criar entrada)
- Vínculo: número do contrato (`Contrato N`)
- Retorno de pagamento (Controlle → Superlógica): opcional
- Stack sugerida: Node.js + TypeScript, polling, store de IDs

Já implementado em outras pastas (fora deste escopo):

- `integrations/superlogica/` — import analítico para Google Sheets
- `integrations/google-sheets-automacao/` — extração da planilha 196A

## Como atualizar o PDF

1. Edite `html/planejamento-superlogica-controlle.html`.
2. Abra o HTML no navegador **ou** regenere com Chrome headless:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/pdf/planejamento-superlogica-controlle.pdf" \
  "file://$(pwd)/docs/html/planejamento-superlogica-controlle.html"
```

3. Confira se o PDF reflete a mesma fase e os mesmos caminhos de pasta do HTML.
