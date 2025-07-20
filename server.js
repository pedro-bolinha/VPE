import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './src/routes.js';

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

// Rotas da API
app.use('/api', router);

// Rota para compatibilidade com o frontend atual
app.get('/empresas', async (req, res) => {
  try {
    // Import dinâmico do modelo para evitar conflitos de inicialização
    const { default: Empresa } = await import('./src/models/empre.js');
    const empresas = await Empresa.read();
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ message: 'Erro ao buscar empresas' });
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
  console.error('Erro no servidor:', err.message);
  res.status(500).json({ message: 'Erro interno do servidor!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api`);
});