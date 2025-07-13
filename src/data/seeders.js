import Database from './databs.js';

async function up() {
  const db = await Database.connect();

  // Inserir empresas
  const empresas = [
    {
      name: "FAMPEPAR",
      descricao: "A FAMPEPAR é uma empresa tradicional no ramo de confeitaria popular, especializada na produção e venda de balas e pirulitos artesanais.",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThdm500SGyX7t-_1Ux9F7F68r2STyLh1Pq-g&s",
      preco: 120000,
      setor: "Alimentício"
    },
    {
      name: "Bolo do Dia",
      descricao: "A Bolo do Dia é uma confeitaria artesanal especializada em bolos caseiros e tortas premium.",
      img: "https://receitatodahora.com.br/wp-content/uploads/2024/04/bolo-mole-1024x684.jpg.webp",
      preco: 95000,
      setor: "Alimentício"
    },
    {
      name: "Salgado Dahora",
      descricao: "A Salgado Dahora é uma rede em expansão no segmento de fast-food regional.",
      img: "https://www.diariozonanorte.com.br/wp-content/uploads/2020/07/coxinha.jpg",
      preco: 110000,
      setor: "Alimentício"
    },
    {
      name: "Basket Pro",
      descricao: "A Basket Pro é uma loja especializada em artigos esportivos com foco em basquete.",
      img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=60",
      preco: 200000,
      setor: "Esportivo"
    },
    {
      name: "Refrescos Brasil",
      descricao: "Distribuidora especializada em bebidas, sucos naturais e refrigerantes regionais.",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRNkIHqKkeGWHxEA_XsB26TDk8YFc0lK7aww&s",
      preco: 250000,
      setor: "Bebidas"
    }
  ];

  const empresaSql = `
    INSERT INTO empresas (name, descricao, img, preco, setor)
    VALUES (?, ?, ?, ?, ?)
  `;

  for (const empresa of empresas) {
    const result = await db.run(empresaSql, [
      empresa.name,
      empresa.descricao,
      empresa.img,
      empresa.preco,
      empresa.setor
    ]);
    
    // Inserir dados financeiros para cada empresa
    const dadosFinanceiros = [
      { mes: "Janeiro", valor: Math.floor(Math.random() * 50000) + 10000 },
      { mes: "Fevereiro", valor: Math.floor(Math.random() * 50000) + 10000 },
      { mes: "Março", valor: Math.floor(Math.random() * 50000) + 10000 },
      { mes: "Abril", valor: Math.floor(Math.random() * 50000) + 10000 },
      { mes: "Maio", valor: Math.floor(Math.random() * 50000) + 10000 },
      { mes: "Junho", valor: Math.floor(Math.random() * 50000) + 10000 }
    ];

    const dadosFinanceirosSql = `
      INSERT INTO dados_financeiros (empresa_id, mes, valor, ano)
      VALUES (?, ?, ?, ?)
    `;

    for (const dado of dadosFinanceiros) {
      await db.run(dadosFinanceirosSql, [
        result.lastID,
        dado.mes,
        dado.valor,
        2024
      ]);
    }
  }

  // Inserir usuários de exemplo
  const usuarios = [
    {
      name: "Admin",
      email: "admin@vpe.com",
      senha_hash: "$2b$10$example", // Em produção, use hash real
      tipo_usuario: "admin"
    },
    {
      name: "Investidor Teste",
      email: "investidor@test.com",
      senha_hash: "$2b$10$example",
      tipo_usuario: "investidor"
    }
  ];

  const usuarioSql = `
    INSERT INTO usuarios (name, email, senha_hash, tipo_usuario)
    VALUES (?, ?, ?, ?)
  `;

  for (const usuario of usuarios) {
    await db.run(usuarioSql, [
      usuario.name,
      usuario.email,
      usuario.senha_hash,
      usuario.tipo_usuario
    ]);
  }

  console.log('Dados inseridos com sucesso!');
}

export default { up };