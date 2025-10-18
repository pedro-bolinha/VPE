document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já está logado
    if (auth.isAuthenticated()) {
        const user = auth.getCurrentUser();
        if (confirm(`Você já está logado como ${user.name}. Deseja ir para a lista de empresas?`)) {
            window.location.href = 'lista_empresas.html';
            return;
        }
    }

    const form = document.querySelector('.formulario');
    const submitButton = form.querySelector('button[type="submit"]');
    const inputs = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        senha: document.getElementById('senha'),
        dataNascimento: document.getElementById('dataNascimento')
    };

    // Indicador de força da senha
    const senhaInput = inputs.senha;
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.style.cssText = `
        margin-top: 5px;
        font-size: 12px;
        font-weight: 600;
        display: none;
    `;
    senhaInput.parentNode.appendChild(strengthIndicator);

    // ===== FUNÇÕES DE UI =====

    function showError(input, message) {
        clearValidation(input);
        
        input.classList.add('input-error');
        input.classList.remove('input-success');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    function showSuccess(input) {
        clearValidation(input);
        
        input.classList.remove('input-error');
        input.classList.add('input-success');
    }

    function clearValidation(input) {
        input.classList.remove('input-error', 'input-success');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    function showLoading() {
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span class="loading-spinner"></span>Criando...';
        submitButton.disabled = true;
    }

    function hideLoading() {
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Criar';
        submitButton.disabled = false;
    }

    function showSuccessMessage(user) {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        
        overlay.innerHTML = `
            <div class="success-box">
                <div class="success-icon">✓</div>
                <h3 class="success-title">Conta criada com sucesso!</h3>
                <p class="success-text">Bem-vindo(a), ${user.name}!</p>
                <p class="success-text">Você será redirecionado para a área de lista de empresas...</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            window.location.href = 'lista_empresas.html';
        }, 3000);
    }

    function showErrorAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'error-alert';
        alert.innerHTML = `
            <strong>Erro!</strong> ${message}
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    // ===== VALIDAÇÃO COM ZOD =====

    function validateField(fieldName, input) {
        const value = input.value;
        const result = ValidationSchemas.validateField(fieldName, value);

        if (!result.success) {
            showError(input, result.error);
            return false;
        } else {
            showSuccess(input);
            
            // Mostrar força da senha
            if (fieldName === 'senha' && value) {
                const strength = ValidationSchemas.getPasswordStrength(value);
                strengthIndicator.style.display = 'block';
                strengthIndicator.textContent = `Força: ${strength.text}`;
                strengthIndicator.style.color = strength.color;
            }
            
            return true;
        }
    }

    function validateAllFields() {
        const formData = {
            nome: inputs.nome.value,
            email: inputs.email.value,
            senha: inputs.senha.value,
            dataNascimento: inputs.dataNascimento.value
        };

        const validation = ValidationSchemas.validateCreateAccountForm(formData);

        if (!validation.success) {
            // Mostrar erros em cada campo
            for (const [fieldName, errorMessage] of Object.entries(validation.errors)) {
                const input = inputs[fieldName];
                if (input) {
                    showError(input, errorMessage);
                }
            }
            
            // Focar no primeiro campo com erro
            const firstErrorField = Object.keys(validation.errors)[0];
            if (firstErrorField && inputs[firstErrorField]) {
                inputs[firstErrorField].focus();
            }
            
            return null;
        }

        return validation.data;
    }

    // ===== EVENT LISTENERS =====

    // Validação em tempo real ao sair do campo
    Object.entries(inputs).forEach(([fieldName, input]) => {
        input.addEventListener('blur', function() {
            if (this.value.trim()) {
                validateField(fieldName, this);
            }
        });

        // Limpar validação ao digitar
        input.addEventListener('input', function() {
            clearValidation(this);
            
            // Para senha, mostrar força em tempo real
            if (fieldName === 'senha' && this.value) {
                const strength = ValidationSchemas.getPasswordStrength(this.value);
                strengthIndicator.style.display = 'block';
                strengthIndicator.textContent = `Força: ${strength.text}`;
                strengthIndicator.style.color = strength.color;
            } else if (fieldName === 'senha' && !this.value) {
                strengthIndicator.style.display = 'none';
            }
        });
    });

    // Submit do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        console.log(' Validando formulário com Zod...');

        // Validar todos os campos
        const validatedData = validateAllFields();
        
        if (!validatedData) {
            console.log(' Validação falhou');
            showErrorAlert('Por favor, corrija os erros no formulário');
            return;
        }

        console.log(' Validação passou:', validatedData);
        console.log(' Criando conta para:', validatedData.email);

        showLoading();

        try {
            // Preparar dados para envio
            const dataToSend = {
                name: validatedData.nome,
                email: validatedData.email,
                senha: validatedData.senha,
                dataNascimento: validatedData.dataNascimento
            };

            // Usar o método de registro do auth manager
            const result = await auth.register(dataToSend);

            if (result.success) {
                console.log(' Conta criada com sucesso:', result.user);
                showSuccessMessage(result.user);
            } else {
                console.error(' Erro ao criar conta:', result.message);
                throw new Error(result.message);
            }

        } catch (error) {
            console.error(' Erro ao criar conta:', error);
            showErrorAlert(error.message || 'Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            hideLoading();
        }
    });

    // Adicionar estilos adicionais
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        .password-strength {
            padding: 5px 10px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            display: inline-block;
            margin-top: 8px;
        }
        
        .input-error {
            border-color: #e74c3c !important;
            background-color: rgba(231, 76, 60, 0.1) !important;
            animation: shake 0.5s;
        }
        
        .input-success {
            border-color: #27ae60 !important;
            background-color: rgba(39, 174, 96, 0.1) !important;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(additionalStyles);

    console.log(' Sistema de criação de conta com validação Zod inicializado');
});