import prisma from '../lib/prisma.js';

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Verificar se já existem dados para evitar duplicação
  const existingEmpresas = await prisma.empresa.count();
  
  if (existingEmpresas > 0) {
    console.log('Dados já existem no banco. Pulando inserção para evitar duplicação.');
    return;
  }

  // Dados das empresas
  const empresasData = [
    {
      name: "FAMPEPAR",
      descricao: "A FAMPEPAR é uma empresa tradicional no ramo de confeitaria popular, especializada na produção e venda de balas e pirulitos artesanais.",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThdm500SGyX7t-_1Ux9F7F68r2STyLh1Pq-g&s",
      preco: 120000,
      setor: "Alimentício",
      dadosFinanceiros: [
        { mes: "Janeiro", valor: 45721 },
        { mes: "Fevereiro", valor: 39812 },
        { mes: "Março", valor: 43902 },
        { mes: "Abril", valor: 38541 },
        { mes: "Maio", valor: 42156 },
        { mes: "Junho", valor: 46789 }
      ]
    },
    {
      name: "Bolo do Dia",
      descricao: "A Bolo do Dia é uma confeitaria artesanal especializada em bolos caseiros e tortas premium.",
      img: "https://receitatodahora.com.br/wp-content/uploads/2024/04/bolo-mole-1024x684.jpg.webp",
      preco: 95000,
      setor: "Alimentício",
      dadosFinanceiros: [
        { mes: "Janeiro", valor: 32450 },
        { mes: "Fevereiro", valor: 28900 },
        { mes: "Março", valor: 35600 },
        { mes: "Abril", valor: 31200 },
        { mes: "Maio", valor: 38700 },
        { mes: "Junho", valor: 41500 }
      ]
    },
    {
      name: "Salgado Dahora",
      descricao: "A Salgado Dahora é uma rede em expansão no segmento de fast-food regional.",
      img: "https://www.diariozonanorte.com.br/wp-content/uploads/2020/07/coxinha.jpg",
      preco: 110000,
      setor: "Alimentício",
      dadosFinanceiros: [
        { mes: "Janeiro", valor: 28500 },
        { mes: "Fevereiro", valor: 31200 },
        { mes: "Março", valor: 29800 },
        { mes: "Abril", valor: 33400 },
        { mes: "Maio", valor: 35100 },
        { mes: "Junho", valor: 37600 }
      ]
    },
    {
      name: "Basket Pro",
      descricao: "A Basket Pro é uma loja especializada em artigos esportivos com foco em basquete.",
      img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=60",
      preco: 200000,
      setor: "Esportivo",
      dadosFinanceiros: [
        { mes: "Janeiro", valor: 56914 },
        { mes: "Fevereiro", valor: 22116 },
        { mes: "Março", valor: 15518 },
        { mes: "Abril", valor: 45721 },
        { mes: "Maio", valor: 39812 },
        { mes: "Junho", valor: 43902 }
      ]
    },
    {
      name: "Refrescos Brasil",
      descricao: "Distribuidora especializada em bebidas, sucos naturais e refrigerantes regionais.",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRNkIHqKkeGWHxEA_XsB26TDk8YFc0lK7aww&s",
      preco: 250000,
      setor: "Bebidas",
      dadosFinanceiros: [
        { mes: "Janeiro", valor: 67800 },
        { mes: "Fevereiro", valor: 72400 },
        { mes: "Março", valor: 69100 },
        { mes: "Abril", valor: 74500 },
        { mes: "Maio", valor: 71200 },
        { mes: "Junho", valor: 76800 }
      ]
    }
  ];

  // Inserir empresas com dados financeiros usando transação
  for (const empresaData of empresasData) {
    const { dadosFinanceiros, ...empresaInfo } = empresaData;
    
    await prisma.empresa.create({
      data: {
        ...empresaInfo,
        dadosFinanceiros: {
          create: dadosFinanceiros.map(df => ({
            mes: df.mes,
            valor: df.valor,
            ano: 2024
          }))
        }
      }
    });
  }

  // Inserir usuários de exemplo apenas se não existirem
  const existingUsuarios = await prisma.usuario.count();
  
  if (existingUsuarios === 0) {
    const usuarios = [
      {
        name: "Admin",
        email: "admin@vpe.com",
        senhaHash: "$2b$10$example", // Em produção, use hash real
        tipoUsuario: "admin"
      },
      {
        name: "Investidor Teste",
        email: "investidor@test.com",
        senhaHash: "$2b$10$example",
        tipoUsuario: "investidor"
      }
    ];

    await prisma.usuario.createMany({
      data: usuarios
    });
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });