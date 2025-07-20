import Database from '../data/databs.js';

async function create({ name, descricao, img, preco, setor }) {
  const db = await Database.connect();
 
  if (name && preco) {
    const sql = `
      INSERT INTO empresas (name, descricao, img, preco, setor)
      VALUES (?, ?, ?, ?, ?)
    `;
 
    const { lastID } = await db.run(sql, [name, descricao, img, preco, setor]);
    return await readById(lastID);
  } else {
    throw new Error('Nome e preço são obrigatórios');
  }
}

async function read(field, value) {
  const db = await Database.connect();
 
  let sql = `
    SELECT 
      e.id, e.name, e.descricao, e.img, e.preco, e.setor
    FROM empresas e
  `;
 
  let params = [];
  
  if (field && value) {
    sql += ` WHERE e.${field} = ?`;
    params.push(value);
  }
  
  sql += ` ORDER BY e.name`;
 
  const empresas = await db.all(sql, params);
  
  // Buscar dados financeiros para cada empresa
  for (let empresa of empresas) {
    const dadosFinanceirosSql = `
      SELECT mes, valor, ano
      FROM dados_financeiros
      WHERE empresa_id = ?
      ORDER BY 
      CASE mes
        WHEN 'Janeiro' THEN 1
        WHEN 'Fevereiro' THEN 2
        WHEN 'Março' THEN 3
        WHEN 'Abril' THEN 4
        WHEN 'Maio' THEN 5
        WHEN 'Junho' THEN 6
        WHEN 'Julho' THEN 7
        WHEN 'Agosto' THEN 8
        WHEN 'Setembro' THEN 9
        WHEN 'Outubro' THEN 10
        WHEN 'Novembro' THEN 11
        WHEN 'Dezembro' THEN 12
      END
    `;
    
    empresa.dadosFinanceiros = await db.all(dadosFinanceirosSql, [empresa.id]);
  }
  
  return empresas;
}

async function readById(id) {
  const db = await Database.connect();
 
  if (id) {
    const sql = `
      SELECT id, name, descricao, img, preco, setor
      FROM empresas
      WHERE id = ?
    `;
 
    const empresa = await db.get(sql, [id]);
 
    if (empresa) {
      // Buscar dados financeiros
      const dadosFinanceirosSql = `
        SELECT mes, valor, ano
        FROM dados_financeiros
        WHERE empresa_id = ?
        ORDER BY 
        CASE mes
          WHEN 'Janeiro' THEN 1
          WHEN 'Fevereiro' THEN 2
          WHEN 'Março' THEN 3
          WHEN 'Abril' THEN 4
          WHEN 'Maio' THEN 5
          WHEN 'Junho' THEN 6
          WHEN 'Julho' THEN 7
          WHEN 'Agosto' THEN 8
          WHEN 'Setembro' THEN 9
          WHEN 'Outubro' THEN 10
          WHEN 'Novembro' THEN 11
          WHEN 'Dezembro' THEN 12
        END
      `;
      
      empresa.dadosFinanceiros = await db.all(dadosFinanceirosSql, [id]);
      return empresa;
    } else {
      throw new Error('Empresa não encontrada');
    }
  } else {
    throw new Error('ID é obrigatório');
  }
}

async function update({ id, name, descricao, img, preco, setor }) {
  const db = await Database.connect();
 
  if (id && name && preco) {
    const sql = `
      UPDATE empresas
      SET name = ?, descricao = ?, img = ?, preco = ?, setor = ?
      WHERE id = ?
    `;
 
    const { changes } = await db.run(sql, [name, descricao, img, preco, setor, id]);
 
    if (changes === 1) {
      return readById(id);
    } else {
      throw new Error('Empresa não encontrada');
    }
  } else {
    throw new Error('ID, nome e preço são obrigatórios');
  }
}

async function remove(id) {
  const db = await Database.connect();
 
  if (id) {
    const sql = `DELETE FROM empresas WHERE id = ?`;
    const { changes } = await db.run(sql, [id]);
 
    if (changes === 1) {
      return true;
    } else {
      throw new Error('Empresa não encontrada');
    }
  } else {
    throw new Error('ID é obrigatório');
  }
}

// Funções para dados financeiros
async function addDadosFinanceiros(empresaId, dadosFinanceiros) {
  const db = await Database.connect();
  
  const sql = `
    INSERT INTO dados_financeiros (empresa_id, mes, valor, ano)
    VALUES (?, ?, ?, ?)
  `;
  
  for (const dado of dadosFinanceiros) {
    await db.run(sql, [empresaId, dado.mes, dado.valor, dado.ano || 2024]);
  }
  
  return readById(empresaId);
}

async function getDadosFinanceiros(empresaId) {
  const db = await Database.connect();
  
  const sql = `
    SELECT mes, valor, ano
    FROM dados_financeiros
    WHERE empresa_id = ?
    ORDER BY ano DESC, 
    CASE mes
      WHEN 'Janeiro' THEN 1
      WHEN 'Fevereiro' THEN 2
      WHEN 'Março' THEN 3
      WHEN 'Abril' THEN 4
      WHEN 'Maio' THEN 5
      WHEN 'Junho' THEN 6
      WHEN 'Julho' THEN 7
      WHEN 'Agosto' THEN 8
      WHEN 'Setembro' THEN 9
      WHEN 'Outubro' THEN 10
      WHEN 'Novembro' THEN 11
      WHEN 'Dezembro' THEN 12
    END
  `;
  
  return await db.all(sql, [empresaId]);
}

export default { 
  create, 
  read, 
  readById, 
  update, 
  remove, 
  addDadosFinanceiros, 
  getDadosFinanceiros 
};