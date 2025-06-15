import { v4 as uuidv4 } from 'uuid';
import { empresas } from '../data/empresa.js';

function create({ name, preco }) {
  const id = uuidv4();
  const empresa = { name, preco, id };

  if (name && preco) {
    empresas.push(empresa);
    return empresa;
  } else {
    throw new Error('Unable to create empresa');
  }
}

function read(field, value) {
  if (field && value) {
    return empresas.filter((empresa) => empresa[field].includes(value));
  }
  return empresas;
}

function readById(id) {
  const index = empresas.findIndex((empresa) => empresa.id === id);
  if (!empresas[index]) {
    throw new Error('Empresa not found');
  }
  return empresas[index];
}

function update({ id, name, preco }) {
  if (id && name && preco) {
    const index = empresas.findIndex((empresa) => empresa.id === id);
    if (index === -1) throw new Error('Empresa not found');
    empresas[index] = { id, name, preco };
    return empresas[index];
  } else {
    throw new Error('Unable to update empresa');
  }
}

function remove(id) {
  const index = empresas.findIndex((empresa) => empresa.id === id);
  if (index === -1) throw new Error('Empresa not found');
  empresas.splice(index, 1);
  return true;
}

export default { create, read, readById, update, remove };