# Controlle — integração (fase arquitetural)

Destino futuro do código da integração **Superlógica → Controlle**.

## Status

**Desenvolvimento arquitetural.** Sem serviços, jobs ou clientes de API nesta pasta.

## Documentação

| Documento | Caminho |
|-----------|---------|
| Índice docs | [`../../docs/README.md`](../../docs/README.md) |
| Planejamento (HTML) | [`../../docs/html/planejamento-superlogica-controlle.html`](../../docs/html/planejamento-superlogica-controlle.html) |
| Planejamento (PDF) | [`../../docs/pdf/planejamento-superlogica-controlle.pdf`](../../docs/pdf/planejamento-superlogica-controlle.pdf) |
| Diagrama Draw.io | [`../../diagrams/fluxo-integracao.drawio`](../../diagrams/fluxo-integracao.drawio) |
| README do monorepo | [`../../README.md`](../../README.md) |

## Escopo planejado (v1)

- **Origem:** Superlógica Imobiliárias (despesas/parcelas — aluguel e compra)
- **Destino:** Controlle (lançamentos de entrada)
- **Vínculo:** número do contrato (`Contrato N` na descrição)
- **Idempotência:** store de IDs (despesa ↔ lançamento)
- **Stack sugerida:** Node.js + TypeScript, polling 15–60 min

## Fora desta pasta

- `../superlogica/` — import Superlógica → Google Sheets
- `../google-sheets-automacao/` — extração 196A (`extracao-contratos-196a.gs`)

Essas automações permanecem independentes e fora do escopo Controlle v1.

## Próximos passos (antes de codar)

1. Validar payloads (listar despesas Superlógica + criar entrada Controlle)
2. Fechar IDs de conta/categorias no Controlle
3. Congelar regra de match (contrato, ou contrato + valor + vencimento)
4. Decidir se o retorno de pagamento entra na v1
5. Só então implementar **nesta pasta**, sob pedido explícito
