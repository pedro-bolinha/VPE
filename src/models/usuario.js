import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Função para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para criar usuário
async function create({ name, email, senha, dataNascimento, cpfCnpj, tipoUsuario = 'investidor', telefone1, telefone2 }) {
  // Validações básicas
  if (!name || !email || !senha) {
    throw new Error('Nome, email e senha são obrigatórios');
  }

  if (name.length < 2) {
    throw new Error('Nome deve ter pelo menos 2 caracteres');
  }

  if (!isValidEmail(email)) {
    throw new Error('Email inválido');
  }

  if (senha.length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres');
  }

  // Validar idade se data de nascimento fornecida
  if (dataNascimento) {
    const birthDate = new Date(dataNascimento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18 || (age === 18 && today < new Date(birthDate.setFullYear(birthDate.getFullYear() + 18)))) {
      throw new Error('Usuário deve ter pelo menos 18 anos');
    }
  }

  try {
    // Verificar se email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        name,
        email,
        senhaHash,
        cpfCnpj,
        tipoUsuario,
        telefone1,
        telefone2,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        createdAt: true
      }
    });

    return usuario;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.message === 'Email já cadastrado') {
      throw error;
    }
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      throw new Error('Email já cadastrado');
    }
    
    throw new Error('Erro ao criar usuário no banco de dados');
  }
}

// Função para autenticar usuário
async function authenticate(email, senha) {
  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }

  try {
    // Buscar usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // Retornar usuário sem a senha
    const { senhaHash, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error.message === 'Email ou senha inválidos') {
      throw error;
    }
    
    throw new Error('Erro interno do servidor');
  }
}

// Função para buscar usuário por ID
async function readById(id) {
  if (!id) {
    throw new Error('ID é obrigatório');
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        cpfCnpj: true,
        tipoUsuario: true,
        telefone1: true,
        telefone2: true,
        dataNascimento: true,
        createdAt: true
      }
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return usuario;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    
    if (error.message === 'Usuário não encontrado') {
      throw error;
    }
    
    throw new Error('Erro ao buscar usuário no banco de dados');
  }
}

// Função para listar usuários (apenas para admin)
async function read() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return usuarios;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw new Error('Erro ao buscar usuários no banco de dados');
  }
}

// Função para atualizar usuário
async function update({ id, name, email, cpfCnpj, telefone1, telefone2 }) {
  if (!id) {
    throw new Error('ID é obrigatório');
  }

  try {
    // Verificar se usuário existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Se email foi alterado, verificar se já existe
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.usuario.findUnique({
        where: { email }
      });

      if (emailExists) {
        throw new Error('Email já está em uso');
      }
    }

    // Atualizar usuário
    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(cpfCnpj && { cpfCnpj }),
        ...(telefone1 && { telefone1 }),
        ...(telefone2 && { telefone2 })
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpfCnpj: true,
        tipoUsuario: true,
        telefone1: true,
        telefone2: true,
        createdAt: true
      }
    });

    return usuario;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.message === 'Usuário não encontrado' || error.message === 'Email já está em uso') {
      throw error;
    }
    
    throw new Error('Erro ao atualizar usuário no banco de dados');
  }
}

// Função para deletar usuário
async function remove(id) {
  if (!id) {
    throw new Error('ID é obrigatório');
  }

  try {
    await prisma.usuario.delete({
      where: { id: parseInt(id) }
    });

    return true;
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    
    if (error.code === 'P2025') {
      throw new Error('Usuário não encontrado');
    }
    
    throw new Error('Erro ao remover usuário do banco de dados');
  }
}

export default {
  create,
  authenticate,
  readById,
  read,
  update,
  remove
}