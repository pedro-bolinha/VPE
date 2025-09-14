import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import Empresa from './src/models/empresa.js';
import Usuario from './src/models/usuario.js';
import prisma from './src/lib/prisma.js';
import { 
  authenticateToken, 
  requireAdmin, 
  optionalAuth, 
  generateToken 
} from './src/middleware/auth.js';

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
app.use(cookieParser());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ====== ROTAS DE AUTENTICAÇÃO ======

// Criar usuário (registro)
app.post('/api/usuarios', async (req, res) => {
  try {
    console.log(' Criando novo usuário:', req.body.email);
    const usuario = await Usuario.create(req.body);
    
    // Gerar token JWT automaticamente após registro
    const token = generateToken(usuario);
    
    console.log(' Usuário criado com sucesso:', usuario.email);
    res.status(201).json({
      success: true,
      usuario,
      token,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.error(' Erro ao criar usuário:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login de usuário
app.post('/api/login', async (req, res) => {
  try {
    console.log(' Tentativa de login:', req.body.email);
    const { email, senha } = req.body;
    
    const usuario = await Usuario.authenticate(email, senha);
    
    // Gerar token JWT
    const token = generateToken(usuario);
    
    console.log(' Login realizado com sucesso:', usuario.email);
    res.json({ 
      success: true, 
      usuario,
      token,
      message: 'Login realizado com sucesso' 
    });
  } catch (error) {
    console.error(' Erro no login:', error.message);
    res.status(401).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Verificar token válido
app.get('/api/verify-token', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user,
    message: 'Token válido'
  });
});

// Logout (invalidar token do lado do cliente)
app.post('/api/logout', (req, res) => {
  console.log(' Usuário fazendo logout');
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Refresh token (gerar novo token)
app.post('/api/refresh-token', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user);
    res.json({
      success: true,
      token: newToken,
      message: 'Token atualizado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar token'
    });
  }
});

// ====== ROTAS PROTEGIDAS DE USUÁRIOS ======

// Buscar perfil do usuário logado
app.get('/api/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    usuario: req.user
  });
});

// Buscar usuário por ID (apenas admin ou próprio usuário)
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const idSolicitado = parseInt(req.params.id);
    
    // Verificar se é admin ou se está acessando próprio perfil
    if (req.user.tipoUsuario !== 'admin' && req.user.id !== idSolicitado) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    console.log(` Buscando usuário ID: ${req.params.id}`);
    const usuario = await Usuario.readById(req.params.id);
    res.json(usuario);
  } catch (error) {
    console.error(' Erro ao buscar usuário por ID:', error.message);
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
    }
  }
});

// Listar usuários (apenas admin)
app.get('/api/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(' Admin listando usuários...');
    const usuarios = await Usuario.read();
    console.log(` Encontrados ${usuarios.length} usuários`);
    res.json(usuarios);
  } catch (error) {
    console.error(' Erro ao listar usuários:', error.message);
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
});

// Atualizar usuário (apenas admin ou próprio usuário)
app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const idSolicitado = parseInt(req.params.id);
    
    // Verificar se é admin ou se está editando próprio perfil
    if (req.user.tipoUsuario !== 'admin' && req.user.id !== idSolicitado) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    console.log(` Atualizando usuário ID: ${req.params.id}`);
    const usuario = await Usuario.update({ ...req.body, id: req.params.id });
    res.json(usuario);
  } catch (error) {
    console.error(' Erro ao atualizar usuário:', error.message);
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Deletar usuário (apenas admin)
app.delete('/api/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(` Admin removendo usuário ID: ${req.params.id}`);
    await Usuario.remove(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    console.error(' Erro ao remover usuário:', error.message);
    if (error.message === 'Usuário não encontrado') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// ====== ROTAS DE EMPRESAS (PÚBLICAS E PROTEGIDAS) ======

// Listar empresas (rota pública com auth opcional)
app.get('/empresas', optionalAuth, async (req, res) => {
  try {
    console.log(' Buscando empresas...');
    const empresas = await Empresa.read();
    console.log(` Encontradas ${empresas.length} empresas`);
    
    // Log se usuário está autenticado
    if (req.user) {
      console.log(` Usuário autenticado: ${req.user.email}`);
    }
    
    res.json(empresas);
  } catch (error) {
    console.error(' Erro ao buscar empresas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar empresas', error: error.message });
  }
});

// API REST para empresas (pública)
app.get('/api/empresas', optionalAuth, async (req, res) => {
  try {
    console.log(' API - Buscando empresas...');
    const { name, setor } = req.query;
    
    let empresas;
    if (name || setor) {
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

// Buscar empresa por ID (público)
app.get('/api/empresas/:id', optionalAuth, async (req, res) => {
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

// ====== ROTAS PROTEGIDAS DE EMPRESAS (APENAS ADMIN) ======

// Criar nova empresa (apenas admin)
app.post('/api/empresas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(' Admin criando nova empresa:', req.body.name);
    const empresa = await Empresa.create(req.body);
    res.status(201).json(empresa);
  } catch (error) {
    console.error(' Erro ao criar empresa:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Atualizar empresa (apenas admin)
app.put('/api/empresas/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(` Admin atualizando empresa ID: ${req.params.id}`);
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

// Deletar empresa (apenas admin)
app.delete('/api/empresas/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(` Admin removendo empresa ID: ${req.params.id}`);
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

// Adicionar dados financeiros (apenas admin)
app.post('/api/empresas/:id/dados-financeiros', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(` Admin adicionando dados financeiros para empresa ID: ${req.params.id}`);
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

// Buscar dados financeiros (usuários logados)
app.get('/api/empresas/:id/dados-financeiros', authenticateToken, async (req, res) => {
  try {
    console.log(` Usuário ${req.user.email} buscando dados financeiros da empresa ID: ${req.params.id}`);
    const dados = await Empresa.getDadosFinanceiros(req.params.id);
    res.json(dados);
  } catch (error) {
    console.error(' Erro ao buscar dados financeiros:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ====== ROTAS DE FAVORITOS (USUÁRIOS LOGADOS) ======

// Adicionar empresa aos favoritos
app.post('/api/favoritos', authenticateToken, async (req, res) => {
  try {
    const { empresaId } = req.body;
    
    const favorito = await prisma.favorito.create({
      data: {
        usuarioId: req.user.id,
        empresaId: parseInt(empresaId)
      },
      include: {
        empresa: true
      }
    });
    
    res.status(201).json({
      success: true,
      favorito,
      message: 'Empresa adicionada aos favoritos'
    });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Empresa já está nos favoritos' });
    } else {
      res.status(400).json({ message: 'Erro ao adicionar favorito' });
    }
  }
});

// Remover empresa dos favoritos
app.delete('/api/favoritos/:empresaId', authenticateToken, async (req, res) => {
  try {
    await prisma.favorito.delete({
      where: {
        usuarioId_empresaId: {
          usuarioId: req.user.id,
          empresaId: parseInt(req.params.empresaId)
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Empresa removida dos favoritos'
    });
  } catch (error) {
    res.status(400).json({ message: 'Erro ao remover favorito' });
  }
});

// Listar favoritos do usuário
app.get('/api/favoritos', authenticateToken, async (req, res) => {
  try {
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId: req.user.id },
      include: {
        empresa: {
          include: {
            dadosFinanceiros: true
          }
        }
      }
    });
    
    res.json(favoritos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar favoritos' });
  }
});

// ====== ROTA DE STATUS ======

app.get('/api/status', async (req, res) => {
  try {
    const empresasCount = await prisma.empresa.count();
    const dadosCount = await prisma.dadoFinanceiro.count();
    const usuariosCount = await prisma.usuario.count();
    
    res.json({
      status: 'OK',
      database: 'Prisma SQLite',
      empresas: empresasCount,
      dadosFinanceiros: dadosCount,
      usuarios: usuariosCount,
      jwt: 'Implementado',
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