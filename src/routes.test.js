// ===== ARQUIVO: test/api.test.js =====
// Testes completos da API VPE usando Node Test Runner
// Execute com: npm test

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import crypto from 'crypto';

// Importar a aplicação
import app from '../server.js';

let validUser;
let authToken;
let createdEmpresa;
let favoritoId;

// ===== HELPER FUNCTIONS =====

function createValidUser() {
  const hash = crypto.randomBytes(10).toString('hex').replace(/[^a-zA-Z]/g, ''); // só letras
  return {
    name: `UsuarioTeste${hash}`,
    email: `teste-${crypto.randomBytes(10).toString('hex')}@email.com`,
    senha: 'senha123',
    dataNascimento: '1990-01-01'
  };
}

async function loadToken(user) {
  const response = await request(app)
    .post('/api/login')
    .send({
      email: user.email,
      senha: user.senha
    });
  
  return response.body.token;
}

// ===== SUÍTE DE TESTES =====

describe('VPE - Sistema de Investimentos', () => {
  
  before(() => {
    validUser = createValidUser();
    console.log('🧪 Iniciando testes do VPE');
  });

  // ===== TESTES DE USUÁRIOS =====
  
  describe('Endpoints de Usuários', () => {
    
    describe('POST /api/usuarios - Criar usuário', () => {
      
      it('deve criar um novo usuário com sucesso', async () => {
        const response = await request(app)
          .post('/api/usuarios')
          .send(validUser);
        
        assert.strictEqual(response.statusCode, 201);
        assert.ok(response.body.success);
        assert.ok(response.body.token);
        assert.strictEqual(response.body.usuario.email, validUser.email);
        
        // Salvar token para testes futuros
        authToken = response.body.token;
      });

      it('não deve criar usuário com email duplicado', async () => {
        const response = await request(app)
          .post('/api/usuarios')
          .send(validUser);
        
        assert.strictEqual(response.statusCode, 400);
        assert.ok(response.body.message.includes('Email já cadastrado'));
      });

      it('não deve criar usuário sem email', async () => {
        const { email, ...userWithoutEmail } = validUser;
        const response = await request(app)
          .post('/api/usuarios')
          .send(userWithoutEmail);
        
        assert.strictEqual(response.statusCode, 400);
      });

      it('não deve criar usuário com senha muito curta', async () => {
        const hash = crypto.randomBytes(10).toString('hex');
        const response = await request(app)
          .post('/api/usuarios')
          .send({
            name: `Teste ${hash}`,
            email: `teste-${hash}@email.com`,
            senha: '123', // senha muito curta
            dataNascimento: '1990-01-01'
          });
        
        assert.strictEqual(response.statusCode, 400);
      });

      it('não deve criar usuário menor de 18 anos', async () => {
        const hash = crypto.randomBytes(10).toString('hex');
        const response = await request(app)
          .post('/api/usuarios')
          .send({
            name: `Teste ${hash}`,
            email: `teste-${hash}@email.com`,
            senha: 'senha123',
            dataNascimento: '2010-01-01' // menor de idade
          });
        
        assert.strictEqual(response.statusCode, 400);
      });
    });

    describe('GET /api/me - Buscar usuário atual', () => {
      
      it('não deve mostrar usuário sem autenticação', async () => {
        const response = await request(app)
          .get('/api/me');
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve mostrar usuário autenticado', async () => {
        const response = await request(app)
          .get('/api/me')
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(response.body.success);
        assert.strictEqual(response.body.usuario.email, validUser.email);
      });
    });
  });

  // ===== TESTES DE LOGIN =====
  
  describe('Endpoints de Login', () => {
    
    describe('POST /api/login', () => {
      
      it('deve fazer login com credenciais válidas', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({
            email: validUser.email,
            senha: validUser.senha
          });
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(response.body.success);
        assert.ok(response.body.token);
        assert.strictEqual(response.body.usuario.email, validUser.email);
      });

      it('não deve fazer login com senha incorreta', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({
            email: validUser.email,
            senha: 'senhaerrada'
          });
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('não deve fazer login com email inexistente', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({
            email: 'naoexiste@email.com',
            senha: 'senha123'
          });
        
        assert.strictEqual(response.statusCode, 401);
      });
    });

    describe('GET /api/verify-token', () => {
      
      it('deve verificar token válido', async () => {
        const response = await request(app)
          .get('/api/verify-token')
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(response.body.valid);
      });

      it('não deve verificar token inválido', async () => {
        const response = await request(app)
          .get('/api/verify-token')
          .set('Authorization', 'Bearer token-invalido');
        
        assert.strictEqual(response.statusCode, 403);
      });
    });
  });

  // ===== TESTES DE EMPRESAS =====
  
  describe('Endpoints de Empresas', () => {
    
    describe('POST /api/empresas - Criar empresa', () => {
      
      it('não deve criar empresa sem autenticação', async () => {
        const response = await request(app)
          .post('/api/empresas')
          .send({
            name: 'Empresa Teste',
            descricao: 'Descrição da empresa teste para validação',
            preco: 50000,
            setor: 'Tecnologia'
          });
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve criar empresa com autenticação', async () => {
        const empresaData = {
          name: 'Empresa Teste VPE',
          descricao: 'Uma empresa de teste para o sistema VPE de investimentos',
          preco: 75000,
          setor: 'Tecnologia',
          img: '/images/sem-imagem.svg'
        };

        const response = await request(app)
          .post('/api/empresas')
          .set('Authorization', `Bearer ${authToken}`)
          .send(empresaData);
        
        assert.strictEqual(response.statusCode, 201);
        assert.strictEqual(response.body.name, empresaData.name);
        assert.strictEqual(response.body.preco, empresaData.preco);
        
        createdEmpresa = response.body;
      });

      it('não deve criar empresa sem nome', async () => {
        const response = await request(app)
          .post('/api/empresas')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            descricao: 'Descrição sem nome',
            preco: 50000
          });
        
        assert.strictEqual(response.statusCode, 400);
      });

      it('não deve criar empresa com preço muito baixo', async () => {
        const response = await request(app)
          .post('/api/empresas')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Empresa Invalida',
            descricao: 'Empresa com preço muito baixo para teste',
            preco: 500 // menor que o mínimo permitido
          });
        
        assert.strictEqual(response.statusCode, 400);
      });
    });

    describe('GET /api/empresas - Listar empresas', () => {
      
      it('deve listar empresas sem autenticação', async () => {
        const response = await request(app)
          .get('/api/empresas');
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(Array.isArray(response.body));
      });

      it('deve encontrar empresa criada na lista', async () => {
        const response = await request(app)
          .get('/api/empresas');
        
        const empresaEncontrada = response.body.find(
          e => e.id === createdEmpresa.id
        );
        
        assert.ok(empresaEncontrada);
        assert.strictEqual(empresaEncontrada.name, createdEmpresa.name);
      });

      it('deve buscar empresas por nome', async () => {
        const response = await request(app)
          .get('/api/empresas?name=Teste');
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(Array.isArray(response.body));
      });
    });

    describe('GET /api/empresas/:id - Buscar empresa por ID', () => {
      
      it('deve buscar empresa por ID válido', async () => {
        const response = await request(app)
          .get(`/api/empresas/${createdEmpresa.id}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.body.id, createdEmpresa.id);
        assert.strictEqual(response.body.name, createdEmpresa.name);
      });

      it('não deve buscar empresa com ID inválido', async () => {
        const response = await request(app)
          .get('/api/empresas/abc');
        
        assert.strictEqual(response.statusCode, 400);
      });

      it('não deve buscar empresa com ID inexistente', async () => {
        const response = await request(app)
          .get('/api/empresas/99999');
        
        assert.strictEqual(response.statusCode, 404);
      });
    });
  });

  // ===== TESTES DE DADOS FINANCEIROS =====
  
  describe('Endpoints de Dados Financeiros', () => {
    
    describe('POST /api/empresas/:id/dados-financeiros', () => {
      
      it('não deve adicionar dados sem autenticação', async () => {
        const response = await request(app)
          .post(`/api/empresas/${createdEmpresa.id}/dados-financeiros`)
          .send({
            dadosFinanceiros: [
              { mes: 'Janeiro', valor: 25000 }
            ]
          });
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve adicionar dados financeiros com autenticação', async () => {
        const response = await request(app)
          .post(`/api/empresas/${createdEmpresa.id}/dados-financeiros`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            dadosFinanceiros: [
              { mes: 'Janeiro', valor: 25000 },
              { mes: 'Fevereiro', valor: 28000 },
              { mes: 'Março', valor: 30000 }
            ]
          });
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(response.body.dadosFinanceiros);
        assert.ok(response.body.dadosFinanceiros.length >= 3);
      });

      it('não deve adicionar dados com mês inválido', async () => {
        const response = await request(app)
          .post(`/api/empresas/${createdEmpresa.id}/dados-financeiros`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            dadosFinanceiros: [
              { mes: 'MesInvalido', valor: 25000 }
            ]
          });
        
        assert.strictEqual(response.statusCode, 400);
      });
    });

    describe('GET /api/empresas/:id/dados-financeiros', () => {
      
      it('não deve buscar dados sem autenticação', async () => {
        const response = await request(app)
          .get(`/api/empresas/${createdEmpresa.id}/dados-financeiros`);
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve buscar dados financeiros com autenticação', async () => {
        const response = await request(app)
          .get(`/api/empresas/${createdEmpresa.id}/dados-financeiros`)
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(Array.isArray(response.body));
      });
    });
  });

  // ===== TESTES DE FAVORITOS =====
  
  describe('Endpoints de Favoritos', () => {
    
    describe('POST /api/favoritos - Adicionar favorito', () => {
      
      it('não deve adicionar favorito sem autenticação', async () => {
        const response = await request(app)
          .post('/api/favoritos')
          .send({ empresaId: createdEmpresa.id });
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve adicionar empresa aos favoritos', async () => {
        const response = await request(app)
          .post('/api/favoritos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ empresaId: createdEmpresa.id });
        
        assert.strictEqual(response.statusCode, 201);
        assert.ok(response.body.success);
        
        favoritoId = response.body.favorito.empresaId;
      });

      it('não deve adicionar mesma empresa duas vezes', async () => {
        const response = await request(app)
          .post('/api/favoritos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ empresaId: createdEmpresa.id });
        
        assert.strictEqual(response.statusCode, 400);
      });

      it('não deve adicionar favorito com ID inválido', async () => {
        const response = await request(app)
          .post('/api/favoritos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ empresaId: 'abc' });
        
        assert.strictEqual(response.statusCode, 400);
      });
    });

    describe('GET /api/favoritos - Listar favoritos', () => {
      
      it('não deve listar favoritos sem autenticação', async () => {
        const response = await request(app)
          .get('/api/favoritos');
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve listar favoritos do usuário', async () => {
        const response = await request(app)
          .get('/api/favoritos')
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(Array.isArray(response.body));
        assert.ok(response.body.length > 0);
      });
    });

    describe('DELETE /api/favoritos/:empresaId - Remover favorito', () => {
      
      it('não deve remover favorito sem autenticação', async () => {
        const response = await request(app)
          .delete(`/api/favoritos/${createdEmpresa.id}`);
        
        assert.strictEqual(response.statusCode, 401);
      });

      it('deve remover empresa dos favoritos', async () => {
        const response = await request(app)
          .delete(`/api/favoritos/${createdEmpresa.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 200);
        assert.ok(response.body.success);
      });

      it('não deve remover favorito inexistente', async () => {
        const response = await request(app)
          .delete(`/api/favoritos/${createdEmpresa.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        assert.strictEqual(response.statusCode, 404);
      });
    });
  });

  // ===== TESTES DE STATUS =====
  
  describe('Endpoint de Status', () => {
    
    it('deve retornar status do sistema', async () => {
      const response = await request(app)
        .get('/api/status');
      
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.status, 'OK');
      assert.ok(response.body.database);
      assert.ok(response.body.estatisticas);
    });
  });

  // ===== TESTES DE ROTAS 404 =====
  
  describe('Rotas Não Encontradas', () => {
    
    it('deve retornar 404 para rota inexistente', async () => {
      const response = await request(app)
        .get('/api/rota-inexistente');
      
      assert.strictEqual(response.statusCode, 404);
    });
  });
});