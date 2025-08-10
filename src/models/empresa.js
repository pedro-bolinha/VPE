import prisma from '../lib/prisma.js';

async function create({ name, descricao, img, preco, setor }) {
  if (!name || !preco) {
    throw new Error('Nome e preço são obrigatórios');
  }

  try {
    const empresa = await prisma.empresa.create({
      data: {
        name,
        descricao,
        img,
        preco: parseFloat(preco),
        setor
      },
      include: {
        dadosFinanceiros: {
          orderBy: [{ ano: 'desc' }]
        }
      }
    });

    return empresa;
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    throw new Error('Erro ao criar empresa no banco de dados');
  }
}

async function read() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        dadosFinanceiros: {
          orderBy: [{ ano: 'desc' }]
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Ordenar dados financeiros por mês
    empresas.forEach(empresa => {
      if (empresa.dadosFinanceiros && empresa.dadosFinanceiros.length > 0) {
        empresa.dadosFinanceiros.sort((a, b) => {
          const meses = {
            'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
            'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
            'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
          };
          return meses[a.mes] - meses[b.mes];
        });
      }
    });

    return empresas;
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    throw new Error('Erro ao buscar empresas no banco de dados');
  }
}

async function readById(id) {
  if (!id) {
    throw new Error('ID é obrigatório');
  }

  try {
    const empresa = await prisma.empresa.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        dadosFinanceiros: {
          orderBy: [{ ano: 'desc' }]
        }
      }
    });

    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    // Ordenar dados financeiros por mês
    if (empresa.dadosFinanceiros && empresa.dadosFinanceiros.length > 0) {
      empresa.dadosFinanceiros.sort((a, b) => {
        const meses = {
          'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
          'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
          'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
        };
        return meses[a.mes] - meses[b.mes];
      });
    }

    return empresa;
  } catch (error) {
    console.error('Erro ao buscar empresa por ID:', error);
    if (error.message === 'Empresa não encontrada') {
      throw error;
    }
    throw new Error('Erro ao buscar empresa no banco de dados');
  }
}

async function update({ id, name, descricao, img, preco, setor }) {
  if (!id || !name || !preco) {
    throw new Error('ID, nome e preço são obrigatórios');
  }

  try {
    const empresa = await prisma.empresa.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        descricao,
        img,
        preco: parseFloat(preco),
        setor
      },
      include: {
        dadosFinanceiros: {
          orderBy: [{ ano: 'desc' }]
        }
      }
    });

    return empresa;
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    if (error.code === 'P2025') {
      throw new Error('Empresa não encontrada');
    }
    throw new Error('Erro ao atualizar empresa no banco de dados');
  }
}

async function remove(id) {
  if (!id) {
    throw new Error('ID é obrigatório');
  }

  try {
    await prisma.empresa.delete({
      where: {
        id: parseInt(id)
      }
    });

    return true;
  } catch (error) {
    console.error('Erro ao remover empresa:', error);
    if (error.code === 'P2025') {
      throw new Error('Empresa não encontrada');
    }
    throw new Error('Erro ao remover empresa do banco de dados');
  }
}

async function addDadosFinanceiros(empresaId, dadosFinanceiros) {
  if (!empresaId || !dadosFinanceiros || !Array.isArray(dadosFinanceiros)) {
    throw new Error('ID da empresa e dados financeiros são obrigatórios');
  }

  try {
    // Verificar se a empresa existe
    const empresaExiste = await prisma.empresa.findUnique({
      where: { id: parseInt(empresaId) }
    });

    if (!empresaExiste) {
      throw new Error('Empresa não encontrada');
    }

    // Adicionar dados financeiros
    const dadosParaCriar = dadosFinanceiros.map(dado => ({
      empresaId: parseInt(empresaId),
      mes: dado.mes,
      valor: parseFloat(dado.valor),
      ano: dado.ano || 2024
    }));

    await prisma.dadoFinanceiro.createMany({
      data: dadosParaCriar
    });

    // Retornar empresa atualizada
    return await readById(empresaId);
  } catch (error) {
    console.error('Erro ao adicionar dados financeiros:', error);
    if (error.message === 'Empresa não encontrada') {
      throw error;
    }
    throw new Error('Erro ao adicionar dados financeiros no banco de dados');
  }
}

async function getDadosFinanceiros(empresaId) {
  if (!empresaId) {
    throw new Error('ID da empresa é obrigatório');
  }

  try {
    const dados = await prisma.dadoFinanceiro.findMany({
      where: {
        empresaId: parseInt(empresaId)
      },
      orderBy: [{ ano: 'desc' }]
    });

    // Ordenar por mês manualmente
    dados.sort((a, b) => {
      const meses = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
      };
      return meses[a.mes] - meses[b.mes];
    });

    return dados;
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    throw new Error('Erro ao buscar dados financeiros no banco de dados');
  }
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