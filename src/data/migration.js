import Database from './databs.js';

async function up() {
  const db = await Database.connect();

  // Tabela de empresas
  const empresasSql = `
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      descricao TEXT,
      img TEXT,
      preco NUMERIC NOT NULL,
      setor VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Tabela de dados financeiros (relacionamento 1:N com empresas)
  const dadosFinanceirosSql = `
    CREATE TABLE IF NOT EXISTS dados_financeiros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      mes VARCHAR(20) NOT NULL,
      valor NUMERIC NOT NULL,
      ano INTEGER DEFAULT 2024,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    );
  `;

  // Tabela de usuários
  const usuariosSql = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      cpf_cnpj VARCHAR(20),
      tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'investidor',
      telefone1 VARCHAR(20),
      telefone2 VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Tabela de favoritos (relacionamento M:N entre usuários e empresas)
  const favoritosSql = `
    CREATE TABLE IF NOT EXISTS favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      empresa_id INTEGER NOT NULL,
      data_favoritado DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, empresa_id)
    );
  `;

  // Tabela de propostas (relacionamento M:N entre usuários e empresas)
  const propostasSql = `
    CREATE TABLE IF NOT EXISTS propostas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      valor_oferecido NUMERIC NOT NULL,
      status VARCHAR(50) DEFAULT 'pendente',
      data_proposta DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `;

  await db.run(empresasSql);
  await db.run(dadosFinanceirosSql);
  await db.run(usuariosSql);
  await db.run(favoritosSql);
  await db.run(propostasSql);

  console.log('Tabelas criadas com sucesso!');
}

export default { up };