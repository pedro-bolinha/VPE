import express from 'express';
import Empresa from './models/empresa.js';

class HTTPError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const router = express.Router();

// Rota para criar empresa
router.post('/empresa', async (req, res) => {
  try {
    const created = await Empresa.create(req.body);
    res.status(201).json(created);
  } catch (error) {
    throw new HTTPError(error.message || 'Erro ao criar empresa', 400);
  }
});

// Rota para listar empresas (com busca opcional)
router.get('/empresa', async (req, res) => {
  try {
    const { name, setor } = req.query;
    let results;
    
    if (name) {
      results = await Empresa.read('name', name);
    } else if (setor) {
      results = await Empresa.read('setor', setor);
    } else {
      results = await Empresa.read();
    }
    
    res.json(results);
  } catch (error) {
    throw new HTTPError(error.message || 'Erro ao buscar empresas', 400);
  }
});

// Rota para buscar empresa por ID
router.get('/empresa/:id', async (req, res) => {
  try {
    const item = await Empresa.readById(req.params.id);
    res.json(item);
  } catch (error) {
    if (error.message === 'Empresa não encontrada') {
      throw new HTTPError(error.message, 404);
    }
    throw new HTTPError(error.message || 'Erro ao buscar empresa', 400);
  }
});

// Rota para atualizar empresa
router.put('/empresa/:id', async (req, res) => {
  try {
    const updated = await Empresa.update({ ...req.body, id: req.params.id });
    res.json(updated);
  } catch (error) {
    if (error.message === 'Empresa não encontrada') {
      throw new HTTPError(error.message, 404);
    }
    throw new HTTPError(error.message || 'Erro ao atualizar empresa', 400);
  }
});

// Rota para deletar empresa
router.delete('/empresa/:id', async (req, res) => {
  try {
    await Empresa.remove(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    if (error.message === 'Empresa não encontrada') {
      throw new HTTPError(error.message, 404);
    }
    throw new HTTPError(error.message || 'Erro ao remover empresa', 400);
  }
});

// Rota para adicionar dados financeiros
router.post('/empresa/:id/dados-financeiros', async (req, res) => {
  try {
    const { dadosFinanceiros } = req.body;
    const updated = await Empresa.addDadosFinanceiros(req.params.id, dadosFinanceiros);
    res.json(updated);
  } catch (error) {
    if (error.message === 'Empresa não encontrada') {
      throw new HTTPError(error.message, 404);
    }
    throw new HTTPError(error.message || 'Erro ao adicionar dados financeiros', 400);
  }
});

// Rota para buscar dados financeiros de uma empresa
router.get('/empresa/:id/dados-financeiros', async (req, res) => {
  try {
    const dados = await Empresa.getDadosFinanceiros(req.params.id);
    res.json(dados);
  } catch (error) {
    throw new HTTPError(error.message || 'Erro ao buscar dados financeiros', 400);
  }
});

// Middleware para rotas não encontradas
router.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada!' });
});

// Middleware para tratamento de erros
router.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  
  if (err instanceof HTTPError) {
    res.status(err.code).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'Erro interno do servidor!' });
  }
});

export default router;