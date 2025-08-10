import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import Empresa from './src/models/empresa.js';
import prisma from './src/lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de caminho __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(morgan('tiny'));
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ROTAS PRINCIPAIS COM PRISMA

// Rota para listar empresas (compatibilidade com frontend atual)
app.get('/empresas', async (req, res) => {
  try {
    console.log(' Buscando empresas do Prisma...');
    const empresas = await Empresa.read();
    console.log(` Encontradas ${empresas.length} empresas`);
    res.json(empresas);
  } catch (error) {
    console.error(' Erro ao buscar empresas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar empresas', error: error.message });
  }
});

// API REST para empresas
app.get('/api/empresas', async (req, res) => {
  try {
    console.log(' API - Buscando empresas do Prisma...');
    const { name, setor } = req.query;
    
    let empresas;
    if (name || setor) {
      // Busca com filtro (implementar se necessário)
      empresas = await Empresa.read();
      if (name) {
        empresas = empresas.filter(e => e.name.toLowerCase().includes(name.toLowerCase()));
      }
      if (setor) {
        empresas = empresas.filter(e => e.setor.toLowerCase().includes(setor.toLowerCase()));
      }
    } else {
      empresas = await Empresa.read();
    }
    
    console.log(` API - Retornadas ${empresas.length} empresas`);
    res.json(empresas);
  } catch (error) {
    console.error(' Erro na API empresas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar empresas', error: error.message });
  }
});

// Buscar empresa por ID
app.get('/api/empresas/:id', async (req, res) => {
  try {
    console.log(` Buscando empresa ID: ${req.params.id}`);
    const empresa = await Empresa.readById(req.params.id);
    res.json(empresa);
  } catch (error) {
    console.error(' Erro ao buscar empresa por ID:', error.message);
    if (error.message === 'Empresa não encontrada') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }
});

// Criar nova empresa
app.post('/api/empresas', async (req, res) => {
  try {
    console.log(' Criando nova empresa:', req.body.name);
    const empresa = await Empresa.create(req.body);
    res.status(201).json(empresa);
  } catch (error) {
    console.error(' Erro ao criar empresa:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Atualizar empresa
app.put('/api/empresas/:id', async (req, res) => {
  try {
    console.log(` Atualizando empresa ID: ${req.params.id}`);
    const empresa = await Empresa.update({ ...req.body, id: req.params.id });
    res.json(empresa);
  } catch (error) {
    console.error(' Erro ao atualizar empresa:', error.message);
    if (error.message === 'Empresa não encontrada') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Deletar empresa
app.delete('/api/empresas/:id', async (req, res) => {
  try {
    console.log(` Removendo empresa ID: ${req.params.id}`);
    await Empresa.remove(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    console.error(' Erro ao remover empresa:', error.message);
    if (error.message === 'Empresa não encontrada') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Adicionar dados financeiros
app.post('/api/empresas/:id/dados-financeiros', async (req, res) => {
  try {
    console.log(` Adicionando dados financeiros para empresa ID: ${req.params.id}`);
    const { dadosFinanceiros } = req.body;
    const empresa = await Empresa.addDadosFinanceiros(req.params.id, dadosFinanceiros);
    res.json(empresa);
  } catch (error) {
    console.error(' Erro ao adicionar dados financeiros:', error.message);
    if (error.message === 'Empresa não encontrada') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Buscar dados financeiros
app.get('/api/empresas/:id/dados-financeiros', async (req, res) => {
  try {
    console.log(` Buscando dados financeiros da empresa ID: ${req.params.id}`);
    const dados = await Empresa.getDadosFinanceiros(req.params.id);
    res.json(dados);
  } catch (error) {
    console.error(' Erro ao buscar dados financeiros:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Rota de status do Prisma
app.get('/api/status', async (req, res) => {
  try {
    const empresasCount = await prisma.empresa.count();
    const dadosCount = await prisma.dadoFinanceiro.count();
    
    res.json({
      status: 'OK',
      database: 'Prisma SQLite',
      empresas: empresasCount,
      dadosFinanceiros: dadosCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(' Erro no servidor:', err.message);
  res.status(500).json({ message: 'Erro interno do servidor!', error: err.message });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('\n Desconectando Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(` Servidor rodando em http://localhost:${PORT}`);

});