import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import Empresa from '../models/empre.js';

async function up() {
  const file = resolve('src', 'data', 'seeders.json');
  const seed = JSON.parse(readFileSync(file));

  for (const empresa of seed.empresas) {
    await Empresa.create(empresa);
  }
}

export default { up };
