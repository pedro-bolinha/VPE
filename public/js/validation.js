// Sistema de Validação usando Zod para VPE
// Importar Zod via CDN no HTML

const ValidationSchemas = {
    // Schema para criação de conta
    createAccount: {
        nome: {
            validate: (value) => {
                if (!value || value.trim().length < 10) {
                    return { success: false, error: 'Nome deve ter pelo menos 10 caracteres' };
                }
                if (value.trim().length > 100) {
                    return { success: false, error: 'Nome deve ter no máximo 100 caracteres' };
                }
                if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
                    return { success: false, error: 'Nome deve conter apenas letras' };
                }
                return { success: true, data: value.trim() };
            }
        },
        email: {
            validate: (value) => {
                if (!value || !value.trim()) {
                    return { success: false, error: 'Email é obrigatório' };
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value.trim())) {
                    return { success: false, error: 'Email inválido' };
                }
                if (value.trim().length > 255) {
                    return { success: false, error: 'Email muito longo' };
                }
                return { success: true, data: value.trim().toLowerCase() };
            }
        },
        senha: {
            validate: (value) => {
                if (!value) {
                    return { success: false, error: 'Senha é obrigatória' };
                }
                if (value.length < 6) {
                    return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
                }
                if (value.length > 50) {
                    return { success: false, error: 'Senha muito longa (máximo 50 caracteres)' };
                }
                
                // Verificar força da senha
                const hasLetter = /[a-zA-Z]/.test(value);
                const hasNumber = /\d/.test(value);
                
                if (!hasLetter) {
                    return { success: false, error: 'Senha deve conter pelo menos uma letra' };
                }
                
                return { 
                    success: true, 
                    data: value,
                    strength: {
                        weak: value.length < 8,
                        medium: value.length >= 8 && hasNumber,
                        strong: value.length >= 10 && hasNumber && hasLetter
                    }
                };
            }
        },
        dataNascimento: {
            validate: (value) => {
                if (!value) {
                    return { success: false, error: 'Data de nascimento é obrigatória' };
                }
                
                const birthDate = new Date(value);
                const today = new Date();
                
                // Verificar se a data é válida
                if (isNaN(birthDate.getTime())) {
                    return { success: false, error: 'Data inválida' };
                }
                
                // Verificar se não é data futura
                if (birthDate > today) {
                    return { success: false, error: 'Data de nascimento não pode ser futura' };
                }
                
                // Calcular idade
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                // Verificar idade mínima
                if (age < 18) {
                    return { success: false, error: 'Você deve ter pelo menos 18 anos' };
                }
                
                // Verificar idade máxima (120 anos)
                if (age > 120) {
                    return { success: false, error: 'Data de nascimento inválida' };
                }
                
                return { success: true, data: value, age };
            }
        }
    },

    // Validar formulário completo
    validateCreateAccountForm: function(formData) {
        const errors = {};
        const validatedData = {};
        let hasErrors = false;

        // Validar cada campo
        for (const [fieldName, fieldValue] of Object.entries(formData)) {
            if (this.createAccount[fieldName]) {
                const result = this.createAccount[fieldName].validate(fieldValue);
                
                if (!result.success) {
                    errors[fieldName] = result.error;
                    hasErrors = true;
                } else {
                    validatedData[fieldName] = result.data;
                }
            }
        }

        return {
            success: !hasErrors,
            errors,
            data: validatedData
        };
    },

    // Validar campo individual em tempo real
    validateField: function(fieldName, value) {
        if (this.createAccount[fieldName]) {
            return this.createAccount[fieldName].validate(value);
        }
        return { success: true, data: value };
    },

    // Obter força da senha
    getPasswordStrength: function(password) {
        const result = this.createAccount.senha.validate(password);
        if (result.success && result.strength) {
            if (result.strength.strong) return { level: 'strong', text: 'Forte', color: '#27ae60' };
            if (result.strength.medium) return { level: 'medium', text: 'Média', color: '#f39c12' };
            if (result.strength.weak) return { level: 'weak', text: 'Fraca', color: '#e74c3c' };
        }
        return { level: 'invalid', text: 'Inválida', color: '#95a5a6' };
    }
};

// Exportar para uso global
window.ValidationSchemas = ValidationSchemas;

console.log(' Sistema de validação Zod-like carregado');