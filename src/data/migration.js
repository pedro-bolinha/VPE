import Database from './databs.js';
 
async function up() {
  const db = await Database.connect();
 
  const empresasSql = `
    CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          cpf_cnpj VARCHAR(20),
          tipo_usuario VARCHAR(50) NOT NULL, -- 'investidor', 'empreendedor', 'admin'
          telefone1 VARCHAR(20),
          telefone2 VARCHAR(20),
          perfil_investidor VARCHAR(100), -- usado apenas se tipo_usuario = 'investidor'
          preferencias_notificacao JSONB DEFAULT '{}' -- ex: {"email": true, "sms": false}
);`
  const negociosSql = `
    CREATE TABLE negocios (
          id SERIAL PRIMARY KEY,
          nome_empresa VARCHAR(255) NOT NULL,
          cnpj VARCHAR(20),
          localizacao VARCHAR(255),
          data_fundacao DATE,
          faturamento NUMERIC,
          funcionarios INTEGER,
          setor VARCHAR(100),
          valor_venda NUMERIC,
          participacao_disponivel NUMERIC, -- percentual
          documentos TEXT[], -- array de links ou nomes de arquivos
          criado_por INTEGER REFERENCES usuarios(id),
          status VARCHAR(50) DEFAULT 'pendente' -- 'pendente', 'publicado', 'rejeitado'
  );`
  const propostasSql = `
    CREATE TABLE propostas (
          id SERIAL PRIMARY KEY,
          id_negocio INTEGER REFERENCES negocios(id),
          id_investidor INTEGER REFERENCES usuarios(id),
          valor_oferecido NUMERIC,
          status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'aceita', 'recusada', 'contraproposta'
          data_proposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  const favoritosSql = `
    CREATE TABLE favoritos (
          id SERIAL PRIMARY KEY,
          id_investidor INTEGER REFERENCES usuarios(id),
          id_negocio INTEGER REFERENCES negocios(id),
          data_favoritado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(id_investidor, id_negocio)
    );`

  const historicoSql = `
    CREATE TABLE historico_interacoes (
          id SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES usuarios(id),
          tipo_interacao VARCHAR(50), -- 'visualizacao', 'proposta', etc.
          id_negocio INTEGER REFERENCES negocios(id),
          data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  const mensagensSql = `
    CREATE TABLE mensagens (
          id SERIAL PRIMARY KEY,
          id_remetente INTEGER REFERENCES usuarios(id),
          id_destinatario INTEGER REFERENCES usuarios(id),
          id_negocio INTEGER REFERENCES negocios(id),
          mensagem TEXT NOT NULL,
          data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  const permissoesSql = `
    CREATE TABLE permissoes (
          id SERIAL PRIMARY KEY,
          nome_permissao VARCHAR(50) UNIQUE NOT NULL -- ex: 'ver_negocios', 'editar_negocio', etc.
    );`
  const usuario_permissaoSql = `
    CREATE TABLE usuario_permissao (
          id SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES usuarios(id),
          id_permissao INTEGER REFERENCES permissoes(id)
    );
  `;
 
  await db.run(empresasSql);
  await db.run(negociosSql);
  await db.run(propostasSql);
  await db.run(favoritosSql);
  await db.run(historicoSql);
  await db.run(mensagensSql);
  await db.run(permissoesSql);
  await db.run(usuario_permissaoSql);
  
}
 
export default { up };
 