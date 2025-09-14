import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vpe-secret-key-change-in-production';

// Gerar token JWT
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario
    },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
}

// Verificar token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

// Middleware para autenticar requisições
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  try {
    const decoded = verifyToken(token);
    
    // Verificar se o usuário ainda existe no banco
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
}

// Middleware para verificar se é admin
export function requireAdmin(req, res, next) {
  if (req.user && req.user.tipoUsuario === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
}

// Middleware para verificar tipos específicos de usuário
export function requireUserType(...allowedTypes) {
  return (req, res, next) => {
    if (req.user && allowedTypes.includes(req.user.tipoUsuario)) {
      next();
    } else {
      res.status(403).json({ 
        message: `Acesso negado. Tipos permitidos: ${allowedTypes.join(', ')}` 
      });
    }
  };
}

// Middleware opcional de autenticação (não falha se não houver token)
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          tipoUsuario: true
        }
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignora erros de token em autenticação opcional
      console.log('Token inválido em auth opcional:', error.message);
    }
  }

  next();
}