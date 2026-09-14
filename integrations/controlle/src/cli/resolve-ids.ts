import {
  entityMatchesCode,
  listCategorias,
  listCentrosCusto,
  listContas,
  pickId,
  pickText,
  type ControlleEntity,
} from '../clients/controlle.js';

function printList(title: string, items: ControlleEntity[]) {
  console.log(`\n=== ${title} (${items.length}) ===`);
  for (const it of items.slice(0, 40)) {
    console.log(`  id=${pickId(it) ?? '?'}  ${pickText(it)}`);
  }
  if (items.length > 40) console.log(`  … +${items.length - 40} mais`);
}

async function main() {
  console.log('Resolvendo IDs Controlle (Bearer único)…');

  const categorias = await listCategorias({ movement: 1 }).catch(async () => listCategorias());
  printList('Categorias (entrada ou todas)', categorias);

  const match3112 = categorias.filter((c) => entityMatchesCode(c, '3.1.12'));
  console.log('\nCandidatos 3.1.12:');
  for (const c of match3112) {
    console.log(`  → id=${pickId(c)}  ${pickText(c)}`);
  }

  let centrosAll = await listCentrosCusto('Intermedia');
  if (!centrosAll.length) centrosAll = await listCentrosCusto();
  printList('Centros de custo', centrosAll);
  const matchCentro = centrosAll.filter((c) =>
    pickText(c).toLowerCase().includes('intermedia'),
  );
  console.log('\nCandidatos Intermediação:');
  for (const c of matchCentro) {
    console.log(`  → id=${pickId(c)}  ${pickText(c)}`);
  }

  const contas = await listContas({ status: 1 }).catch(async () => listContas());
  printList('Contas (ativas ou todas)', contas);

  const idCat = match3112.map(pickId).find((x) => x != null);
  const idCentro = matchCentro.map(pickId).find((x) => x != null);
  const idConta = contas.map(pickId).find((x) => x != null);

  console.log('\n=== Sugestão para .env ===');
  console.log(`CONTROLLE_ID_CATEGORIA_3112=${idCat ?? ''}`);
  console.log(`CONTROLLE_ID_CENTRO_INTERMEDIACAO=${idCentro ?? ''}`);
  console.log(`CONTROLLE_ID_CONTA_PADRAO=${idConta ?? '(escolha a conta bancária correta)'}`);
  console.log('\nCopie os IDs corretos para integrations/controlle/.env');
}

main().catch((err) => {
  console.error(err);
  if (err && typeof err === 'object' && 'body' in err) {
    console.error('Body:', (err as { body: string }).body);
  }
  process.exit(1);
});
