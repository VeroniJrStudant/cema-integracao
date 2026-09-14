import path from 'node:path';
import { uploadCsvToDrive } from '../drive/upload-csv.js';

const file = process.argv[2];
if (!file) {
  console.error('Uso: npm run drive:upload -- caminho/arquivo.csv');
  process.exit(1);
}

const localPath = path.resolve(file);
uploadCsvToDrive(localPath).catch((err) => {
  console.error('[drive] falhou:', err);
  process.exit(1);
});
