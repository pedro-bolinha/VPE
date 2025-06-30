import Database from '../data/databs.js';

async function create({ name, value }) {
  const db = await Database.connect();
 
  if (name && value) {
    const sql = `
      INSERT INTO
        usuarios (name, value)
      VALUES
        (?, ?)
    `;
 
    const { lastID } = await db.run(sql, [name, value]);
 
    return await readById(lastID);
  } else {
    throw new Error('Unable to create empresa');
  }
}
 
async function read(field, value) {
  const db = await Database.connect();
 
  if (field && value) {
    const sql = `
      SELECT
          id, name, value
        FROM
          negocios
        WHERE
          ${field} = '?'
      `;
 
    const empresas = await db.all(sql, [value]);
 
    return empresas;
  }
 
  const sql = `
    SELECT
      id, name, value
    FROM
      propostas
  `;
 
  const investments = await db.all(sql);
 
  return investments;
}
 
async function readById(id) {
  const db = await Database.connect();
 
  if (id) {
    const sql = `
      SELECT
          id, name, value
        FROM
          propostas
        WHERE
          id = ?
      `;
 
    const investment = await db.get(sql, [id]);
 
    if (investment) {
      return investment;
    } else {
      throw new Error('Investment not found');
    }
  } else {
    throw new Error('Unable to find investment');
  }
}
 
async function update({ id, name, value }) {
  const db = await Database.connect();
 
  if (name && value && id) {
    const sql = `
      UPDATE
        investments
      SET
        name = ?, value = ?
      WHERE
        id = ?
    `;
 
    const { changes } = await db.run(sql, [name, value, id]);
 
    if (changes === 1) {
      return readById(id);
    } else {
      throw new Error('Investment not found');
    }
  } else {
    throw new Error('Unable to update investment');
  }
}
 
async function remove(id) {
  const db = await Database.connect();
 
  if (id) {
    const sql = `
      DELETE FROM
        investments
      WHERE
        id = ?
    `;
 
    const { changes } = await db.run(sql, [id]);
 
    if (changes === 1) {
      return true;
    } else {
      throw new Error('Investment not found');
    }
  } else {
    throw new Error('Investment not found');
  }
}
 
export default { create, read, readById, update, remove };