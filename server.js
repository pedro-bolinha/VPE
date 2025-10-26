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

// ===== IMPORTAR VALIDAÇÕES ZOD =====
import { 
  validate,
  createUserSchema,
  loginSchema,
  createEmpresaSchema,
  updateEmpresaSchema,
  addDadosFinanceirosSchema,
  addFavoritoSchema,
  searchEmpresasSchema,
  idParamSchema,
  updateUserSchema
} from './src/middleware/validation.js';

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

// ====== ROTAS DE AUTENTICAÇÃO COM VALIDAÇÃO ======

// Criar usuário (registro) - COM VALIDAÇÃO ZOD
app.post('/api/usuarios', validate(createUserSchema), async (req, res) => {
  try {
    console.log(' Criando novo usuário:', req.body.email);
    
    // req.body já foi validado pelo middleware Zod
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

// Login de usuário - COM VALIDAÇÃO ZOD
app.post('/api/login', validate(loginSchema), async (req, res) => {
  try {
    console.log(' Tentativa de login:', req.body.email);
    
    // req.body já validado
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

// ====== ROTAS PROTEGIDAS DE USUÁRIOS COM VALIDAÇÃO ======

// Buscar perfil do usuário logado
app.get('/api/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    usuario: req.user
  });
});

// Buscar usuário por ID - COM VALIDAÇÃO
app.get('/api/usuarios/:id', 
  authenticateToken, 
  validate(idParamSchema),
  async (req, res) => {
    try {
      const idSolicitado = req.params.id; // Já transformado em number pelo Zod
      
      // Verificar se é admin ou se está acessando próprio perfil
      if (req.user.tipoUsuario !== 'admin' && req.user.id !== idSolicitado) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log(` Buscando usuário ID: ${idSolicitado}`);
      const usuario = await Usuario.readById(idSolicitado);
      res.json(usuario);
    } catch (error) {
      console.error(' Erro ao buscar usuário por ID:', error.message);
      if (error.message === 'Usuário não encontrado') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
      }
    }
  }
);

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

// Atualizar usuário - COM VALIDAÇÃO
app.put('/api/usuarios/:id', 
  authenticateToken,
  validate(updateUserSchema),
  async (req, res) => {
    try {
      const idSolicitado = req.params.id; // Já validado e transformado
      
      // Verificar se é admin ou se está editando próprio perfil
      if (req.user.tipoUsuario !== 'admin' && req.user.id !== idSolicitado) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      console.log(` Atualizando usuário ID: ${idSolicitado}`);
      const usuario = await Usuario.update({ ...req.body, id: idSolicitado });
      res.json(usuario);
    } catch (error) {
      console.error(' Erro ao atualizar usuário:', error.message);
      if (error.message === 'Usuário não encontrado') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);

// Deletar usuário (apenas admin) - COM VALIDAÇÃO
app.delete('/api/usuarios/:id', 
  authenticateToken, 
  requireAdmin,
  validate(idParamSchema),
  async (req, res) => {
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
  }
);

// ====== ROTAS DE EMPRESAS COM VALIDAÇÃO ======

// Listar empresas (rota pública com auth opcional) - COM VALIDAÇÃO DE QUERY
app.get('/empresas', optionalAuth, validate(searchEmpresasSchema), async (req, res) => {
  try {
    console.log(' Buscando empresas...');
    const empresas = await Empresa.read();
    console.log(` Encontradas ${empresas.length} empresas`);
    
    if (req.user) {
      console.log(` Usuário autenticado: ${req.user.email}`);
    }
    
    res.json(empresas);
  } catch (error) {
    console.error(' Erro ao buscar empresas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar empresas', error: error.message });
  }
});

// API REST para empresas (pública) - COM VALIDAÇÃO
app.get('/api/empresas', optionalAuth, validate(searchEmpresasSchema), async (req, res) => {
  try {
    console.log(' API - Buscando empresas...');
    const { name, setor } = req.query; // Query já validada
    
    let empresas;
    if (name || setor) {
      empresas = await Empresa.read();
      if (name) {
        empresas = empresas.filter(e => e.name.toLowerCase().includes(name.toLowerCase()));
      }
      if (setor) {
        empresas = empresas.filter(e => e.setor?.toLowerCase().includes(setor.toLowerCase()));
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

// Buscar empresa por ID - COM VALIDAÇÃO
app.get('/api/empresas/:id', 
  optionalAuth, 
  validate(idParamSchema),
  async (req, res) => {
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
  }
);

// Criar nova empresa - COM VALIDAÇÃO COMPLETA
app.post('/api/empresas', 
  authenticateToken, 
  validate(createEmpresaSchema), 
  async (req, res) => {
    try {
      console.log(` Usuário ${req.user.email} (${req.user.tipoUsuario}) criando nova empresa:`, req.body.name);
      
      // req.body já totalmente validado pelo Zod
      const empresa = await Empresa.create(req.body);
      
      console.log(` Empresa "${empresa.name}" criada com sucesso por ${req.user.email}`);
      res.status(201).json(empresa);
    } catch (error) {
      console.error(' Erro ao criar empresa:', error.message);
      res.status(400).json({ message: error.message });
    }
  }
);

// Atualizar empresa - COM VALIDAÇÃO
app.put('/api/empresas/:id', 
  authenticateToken, 
  requireAdmin,
  validate(updateEmpresaSchema),
  async (req, res) => {
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
  }
);

// Deletar empresa - COM VALIDAÇÃO
app.delete('/api/empresas/:id', 
  authenticateToken, 
  requireAdmin,
  validate(idParamSchema),
  async (req, res) => {
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
  }
);

// Adicionar dados financeiros - COM VALIDAÇÃO COMPLETA
app.post('/api/empresas/:id/dados-financeiros', 
  authenticateToken,
  validate(addDadosFinanceirosSchema),
  async (req, res) => {
    try {
      console.log(` Usuário ${req.user.email} adicionando dados financeiros para empresa ID: ${req.params.id}`);
      
      // req.body.dadosFinanceiros já validado pelo Zod
      const { dadosFinanceiros } = req.body;
      
      const empresa = await Empresa.addDadosFinanceiros(req.params.id, dadosFinanceiros);
      console.log(` Dados financeiros adicionados com sucesso para empresa: ${empresa.name}`);
      res.json(empresa);
    } catch (error) {
      console.error(' Erro ao adicionar dados financeiros:', error.message);
      if (error.message === 'Empresa não encontrada') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
);

// Buscar dados financeiros - COM VALIDAÇÃO
app.get('/api/empresas/:id/dados-financeiros', 
  authenticateToken,
  validate(idParamSchema),
  async (req, res) => {
    try {
      console.log(` Usuário ${req.user.email} buscando dados financeiros da empresa ID: ${req.params.id}`);
      const dados = await Empresa.getDadosFinanceiros(req.params.id);
      res.json(dados);
    } catch (error) {
      console.error(' Erro ao buscar dados financeiros:', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// ====== ROTAS DE FAVORITOS COM VALIDAÇÃO ======

// Adicionar empresa aos favoritos - COM VALIDAÇÃO
app.post('/api/favoritos', 
  authenticateToken,
  validate(addFavoritoSchema),
  async (req, res) => {
    try {
      const { empresaId } = req.body; // Já validado pelo Zod
      
      console.log(` Usuário ${req.user.email} adicionando empresa ${empresaId} aos favoritos`);
      
      const favorito = await prisma.favorito.create({
        data: {
          usuarioId: req.user.id,
          empresaId: empresaId
        },
        include: {
          empresa: true
        }
      });
      
      console.log(` Favorito adicionado: ${favorito.empresa.name}`);
      res.status(201).json({
        success: true,
        favorito,
        message: 'Empresa adicionada aos favoritos'
      });
    } catch (error) {
      console.error(' Erro ao adicionar favorito:', error);
      if (error.code === 'P2002') {
        res.status(400).json({ message: 'Empresa já está nos favoritos' });
      } else if (error.code === 'P2003') {
        res.status(404).json({ message: 'Empresa não encontrada' });
      } else {
        res.status(400).json({ message: 'Erro ao adicionar favorito' });
      }
    }
  }
);

// Remover empresa dos favoritos - COM VALIDAÇÃO
app.delete('/api/favoritos/:empresaId', 
  authenticateToken,
  validate(idParamSchema),
  async (req, res) => {
    try {
      const empresaId = req.params.empresaId; // Já validado e transformado
      
      console.log(` Usuário ${req.user.email} removendo empresa ${empresaId} dos favoritos`);
      
      const deletedCount = await prisma.favorito.deleteMany({
        where: {
          usuarioId: req.user.id,
          empresaId: empresaId
        }
      });
      
      if (deletedCount.count === 0) {
        return res.status(404).json({ message: 'Favorito não encontrado' });
      }
      
      console.log(' Favorito removido com sucesso');
      res.json({
        success: true,
        message: 'Empresa removida dos favoritos'
      });
    } catch (error) {
      console.error(' Erro ao remover favorito:', error);
      res.status(400).json({ message: 'Erro ao remover favorito' });
    }
  }
);

// Listar favoritos do usuário
app.get('/api/favoritos', authenticateToken, async (req, res) => {
  try {
    console.log(` Buscando favoritos do usuário: ${req.user.email}`);
    
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId: req.user.id },
      include: {
        empresa: {
          include: {
            dadosFinanceiros: true
          }
        }
      },
      orderBy: {
        dataFavoritado: 'desc'
      }
    });
    
    console.log(` Encontrados ${favoritos.length} favoritos`);
    res.json(favoritos);
  } catch (error) {
    console.error(' Erro ao buscar favoritos:', error);
    res.status(500).json({ message: 'Erro ao buscar favoritos' });
  }
});

// ====== ROTA DE STATUS E ESTATÍSTICAS ======

app.get('/api/status', async (req, res) => {
  try {
    const empresasCount = await prisma.empresa.count();
    const dadosCount = await prisma.dadoFinanceiro.count();
    const usuariosCount = await prisma.usuario.count();
    const favoritosCount = await prisma.favorito.count();
    
    // Estatísticas por tipo de usuário
    const usuariosPorTipo = await prisma.usuario.groupBy({
      by: ['tipoUsuario'],
      _count: true
    });
    
    // Empresas por setor
    const empresasPorSetor = await prisma.empresa.groupBy({
      by: ['setor'],
      _count: true,
      where: {
        setor: {
          not: null
        }
      }
    });
    
    res.json({
      status: 'OK',
      database: 'Prisma SQLite',
      timestamp: new Date().toISOString(),
      validacao: 'Zod ',
      estatisticas: {
        empresas: empresasCount,
        dadosFinanceiros: dadosCount,
        usuarios: usuariosCount,
        favoritos: favoritosCount
      },
      usuariosPorTipo: usuariosPorTipo.reduce((acc, item) => {
        acc[item.tipoUsuario] = item._count;
        return acc;
      }, {}),
      empresasPorSetor: empresasPorSetor.reduce((acc, item) => {
        acc[item.setor] = item._count;
        return acc;
      }, {}),
      recursos: {
        'Cadastro de empresas': 'Liberado para todos os usuários',
        'Dados financeiros': 'Usuários autenticados',
        'Sistema de favoritos': 'Usuários autenticados',
        'Gestão administrativa': 'Apenas administradores',
        'Validação Zod': 'Ativa em todas as rotas'
      }
    });
  } catch (error) {
    console.error(' Erro ao buscar status:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ====== ROTAS ADMINISTRATIVAS (APENAS ADMIN) ======

// Listar todas as empresas com informações do criador (admin)
app.get('/api/admin/empresas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(' Admin buscando todas as empresas com detalhes...');
    
    const empresas = await prisma.empresa.findMany({
      include: {
        dadosFinanceiros: true,
        favoritos: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(` Admin - Encontradas ${empresas.length} empresas`);
    res.json(empresas);
  } catch (error) {
    console.error(' Erro ao buscar empresas (admin):', error);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
  }
});

// Estatísticas detalhadas (admin)
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(' Admin buscando estatísticas detalhadas...');
    
    const stats = {
      usuarios: await prisma.usuario.count(),
      empresas: await prisma.empresa.count(),
      favoritos: await prisma.favorito.count(),
      dadosFinanceiros: await prisma.dadoFinanceiro.count(),
      
      // Empresas mais favoritadas
      empresasMaisFavoritadas: await prisma.empresa.findMany({
        select: {
          id: true,
          name: true,
          setor: true,
          _count: {
            select: {
              favoritos: true
            }
          }
        },
        orderBy: {
          favoritos: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Usuários mais ativos (que mais favoritaram)
      usuariosMaisAtivos: await prisma.usuario.findMany({
        select: {
          name: true,
          email: true,
          tipoUsuario: true,
          _count: {
            select: {
              favoritos: true
            }
          }
        },
        orderBy: {
          favoritos: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      
      // Cadastros por dia (últimos 7 dias)
      cadastrosPorDia: await prisma.empresa.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    };
    
    res.json(stats);
  } catch (error) {
    console.error(' Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// ====== ROTAS PRINCIPAIS E MIDDLEWARE DE ERRO ======

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  console.log(` Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(' Erro no servidor:', err.message);
  console.error('Stack:', err.stack);
  
  // Se é erro de validação do Prisma
  if (err.code && err.code.startsWith('P')) {
    const prismaErrorMessages = {
      'P2002': 'Dados duplicados - este registro já existe',
      'P2003': 'Referência inválida - registro relacionado não encontrado',
      'P2025': 'Registro não encontrado'
    };
    
    return res.status(400).json({ 
      message: prismaErrorMessages[err.code] || 'Erro no banco de dados',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  res.status(500).json({ 
    message: 'Erro interno do servidor!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ====== GRACEFUL SHUTDOWN ======

process.on('beforeExit', async () => {
  console.log(' Desconectando do banco de dados...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('\n Servidor interrompido. Desconectando Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(' Servidor terminado. Desconectando Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

// ====== INICIALIZAÇÃO DO SERVIDOR ======

app.listen(PORT, () => {
  console.log(` URL: http://localhost:${PORT}`);
});