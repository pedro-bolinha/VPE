import { z } from 'zod';

// ===== SCHEMAS DE VALIDAÇÃO =====

// Schema para criação de usuário
export const createUserSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Nome é obrigatório",
      invalid_type_error: "Nome deve ser texto"
    })
      .min(10, "Nome deve ter pelo menos 10 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
    
    email: z.string({
      required_error: "Email é obrigatório"
    })
      .email("Email inválido")
      .max(255, "Email muito longo")
      .toLowerCase()
      .trim(),
    
    senha: z.string({
      required_error: "Senha é obrigatória"
    })
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(50, "Senha deve ter no máximo 50 caracteres")
      .regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra"),
    
    dataNascimento: z.string({
      required_error: "Data de nascimento é obrigatória"
    })
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        let finalAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          finalAge--;
        }
        
        return finalAge >= 18 && finalAge <= 120;
      }, "Você deve ter entre 18 e 120 anos"),
    
    cpfCnpj: z.string().optional(),
    tipoUsuario: z.enum(['investidor', 'empresa', 'admin']).default('investidor'),
    telefone1: z.string().optional(),
    telefone2: z.string().optional()
  })
});

// Schema para login
export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email é obrigatório"
    })
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    
    senha: z.string({
      required_error: "Senha é obrigatória"
    })
      .min(1, "Senha não pode ser vazia")
  })
});

// Schema para criação de empresa
export const createEmpresaSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Nome da empresa é obrigatório"
    })
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .trim(),
    
    descricao: z.string({
      required_error: "Descrição é obrigatória"
    })
      .min(10, "Descrição deve ter pelo menos 10 caracteres")
      .max(1000, "Descrição deve ter no máximo 1000 caracteres")
      .trim(),
    
    preco: z.number({
      required_error: "Preço é obrigatório",
      invalid_type_error: "Preço deve ser um número"
    })
      .min(1000, "Preço mínimo é R$ 1.000")
      .max(100000000, "Preço máximo é R$ 100.000.000"),
    
    img: z.string()
      .url("URL da imagem inválida")
      .optional()
      .or(z.literal('')),
    
    setor: z.string().optional()
  })
});

// Schema para atualização de empresa
export const updateEmpresaSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, "ID deve ser numérico")
      .transform(Number)
  }),
  body: z.object({
    name: z.string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .trim()
      .optional(),
    
    descricao: z.string()
      .min(10, "Descrição deve ter pelo menos 10 caracteres")
      .max(1000, "Descrição deve ter no máximo 1000 caracteres")
      .trim()
      .optional(),
    
    preco: z.number()
      .min(1000, "Preço mínimo é R$ 1.000")
      .max(100000000, "Preço máximo é R$ 100.000.000")
      .optional(),
    
    img: z.string()
      .url("URL da imagem inválida")
      .optional(),
    
    setor: z.string().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização"
  })
});

// Schema para dados financeiros
export const addDadosFinanceirosSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, "ID deve ser numérico")
      .transform(Number)
  }),
  body: z.object({
    dadosFinanceiros: z.array(
      z.object({
        mes: z.enum([
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 
          'Maio', 'Junho', 'Julho', 'Agosto',
          'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ], {
          required_error: "Mês é obrigatório",
          invalid_type_error: "Mês inválido"
        }),
        valor: z.number({
          required_error: "Valor é obrigatório",
          invalid_type_error: "Valor deve ser um número"
        })
          .min(0, "Valor deve ser positivo"),
        ano: z.number()
          .int("Ano deve ser número inteiro")
          .min(2000, "Ano deve ser a partir de 2000")
          .max(2100, "Ano inválido")
          .optional()
          .default(new Date().getFullYear())
      })
    )
      .min(1, "Deve haver pelo menos um dado financeiro")
      .max(12, "Máximo 12 meses permitidos")
  })
});

// Schema para favoritos
export const addFavoritoSchema = z.object({
  body: z.object({
    empresaId: z.number({
      required_error: "ID da empresa é obrigatório",
      invalid_type_error: "ID deve ser numérico"
    })
      .int("ID deve ser número inteiro")
      .positive("ID deve ser positivo")
  })
});

// Schema para query de busca
export const searchEmpresasSchema = z.object({
  query: z.object({
    name: z.string().optional(),
    setor: z.string().optional(),
    minPreco: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, "Preço mínimo inválido")
      .transform(Number)
      .optional(),
    maxPreco: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, "Preço máximo inválido")
      .transform(Number)
      .optional()
  })
});

// Schema para parâmetros de ID
export const idParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, "ID deve ser numérico")
      .transform(Number)
  })
});

// ===== MIDDLEWARE DE VALIDAÇÃO =====

/**
 * Middleware genérico para validar requisições com Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @returns Middleware Express
 */
export function validate(schema) {
  return async (req, res, next) => {
    try {
      // Validar a requisição completa (body, params, query)
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });

      // Atualizar req com dados validados e transformados
      req.validatedData = validatedData;
      
      // Se o schema validou o body, substituir pelo validado
      if (validatedData.body) {
        req.body = validatedData.body;
      }
      
      // Se o schema validou os params, substituir pelos validados
      if (validatedData.params) {
        req.params = validatedData.params;
      }
      
      // Se o schema validou a query, substituir pela validada
      if (validatedData.query) {
        req.query = validatedData.query;
      }

      next();
    } catch (error) {
      // Tratar erros de validação do Zod
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message,
          codigo: err.code
        }));

        console.error(' Erro de validação Zod:', {
          rota: `${req.method} ${req.path}`,
          erros: errors
        });

        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: errors,
          timestamp: new Date().toISOString()
        });
      }

      // Outros erros
      console.error(' Erro inesperado na validação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  };
}

// ===== MIDDLEWARE DE VALIDAÇÃO CONDICIONAL =====

/**
 * Valida apenas se os campos estiverem presentes
 * Útil para atualizações parciais
 */
export function validatePartial(schema) {
  return validate(schema.partial());
}

// ===== HELPERS DE VALIDAÇÃO =====

/**
 * Valida manualmente um dado com um schema
 * Útil para validações em services/models
 */
export async function validateData(schema, data) {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ mensagem: 'Erro desconhecido na validação' }]
    };
  }
}

/**
 * Função para validar array de dados financeiros
 * Remove duplicatas de meses
 */
export function validateAndNormalizeDadosFinanceiros(dados) {
  const mesesUnicos = new Map();
  
  dados.forEach(dado => {
    const key = `${dado.mes}-${dado.ano || new Date().getFullYear()}`;
    if (!mesesUnicos.has(key)) {
      mesesUnicos.set(key, dado);
    }
  });
  
  return Array.from(mesesUnicos.values());
}

// ===== SCHEMAS CUSTOMIZADOS ADICIONAIS =====

// Schema para atualização de usuário
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, "ID deve ser numérico")
      .transform(Number)
  }),
  body: z.object({
    name: z.string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .optional(),
    
    email: z.string()
      .email("Email inválido")
      .toLowerCase()
      .trim()
      .optional(),
    
    cpfCnpj: z.string().optional(),
    telefone1: z.string().optional(),
    telefone2: z.string().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido"
  })
});

console.log(' Middleware de validação Zod carregado');

export default {
  validate,
  validatePartial,
  validateData,
  validateAndNormalizeDadosFinanceiros,
  // Exportar todos os schemas
  createUserSchema,
  loginSchema,
  createEmpresaSchema,
  updateEmpresaSchema,
  addDadosFinanceirosSchema,
  addFavoritoSchema,
  searchEmpresasSchema,
  idParamSchema,
  updateUserSchema
};
