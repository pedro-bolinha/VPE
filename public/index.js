document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário já está logado
    if (auth.isAuthenticated()) {
        const user = auth.getCurrentUser();
        const loginAge = auth.getLoginAge();
        
        // Se login é muito antigo, fazer logout
        if (loginAge >= 24) {
            auth.logout();
            return;
        }
        
        // Mostrar opção para continuar logado
        showContinueLoggedIn(user);
        return;
    }

    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('nome');
    const senhaInput = document.getElementById('senha');

    // Função para mostrar loading
    function showLoading() {
        submitButton.innerHTML = '<span class="spinner"></span>Entrando...';
        submitButton.disabled = true;
        submitButton.style.opacity = '0.7';
        submitButton.style.cursor = 'not-allowed';
    }

    // Função para esconder loading
    function hideLoading() {
        submitButton.innerHTML = 'Entrar';
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
    }

    // Função para mostrar mensagem de erro
    function showError(message) {
        // Remove erro anterior se existir
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid #e74c3c;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.2);
        `;
        errorDiv.innerHTML = `<strong>Erro:</strong> ${message}`;
        
        // Inserir antes do botão
        form.insertBefore(errorDiv, submitButton);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }

    // Função para mostrar mensagem de sucesso
    function showSuccess(message) {
        // Remove mensagem anterior se existir
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            color: #27ae60;
            background: rgba(39, 174, 96, 0.1);
            border: 1px solid #27ae60;
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(39, 174, 96, 0.2);
        `;
        successDiv.innerHTML = `<strong>Sucesso:</strong> ${message}`;
        
        form.insertBefore(successDiv, submitButton);
    }

    // Função para mostrar opção de continuar logado
    function showContinueLoggedIn(user) {
        const continueDiv = document.createElement('div');
        continueDiv.style.cssText = `
            background: rgba(52, 152, 219, 0.1);
            border: 1px solid #3498db;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
            font-size: 14px;
        `;
        continueDiv.innerHTML = `
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #3498db; font-size: 16px;">
                    <strong>Olá, ${user.name}!</strong>
                </p>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    Você ainda está logado. Deseja continuar?
                </p>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button type="button" id="continueBtn" 
                        style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Continuar
                </button>
                <button type="button" id="newLoginBtn" 
                        style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Novo Login
                </button>
                <button type="button" id="logoutBtn" 
                        style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Sair
                </button>
            </div>
        `;
        
        form.insertBefore(continueDiv, form.firstChild);

        // Event listeners para os botões
        document.getElementById('continueBtn').addEventListener('click', () => {
            window.location.href = 'lista_empresas.html';
        });

        document.getElementById('newLoginBtn').addEventListener('click', () => {
            continueDiv.remove();
            emailInput.focus();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
            continueDiv.remove();
            showSuccess('Logout realizado com sucesso!');
        });
    }

    // Função para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para validar campos
    function validateFields() {
        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        // Limpar estilos de erro
        [emailInput, senhaInput].forEach(input => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        });

        if (!email) {
            showError('Email é obrigatório');
            emailInput.style.borderColor = '#e74c3c';
            emailInput.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            emailInput.focus();
            return false;
        }

        if (!isValidEmail(email)) {
            showError('Por favor, digite um email válido');
            emailInput.style.borderColor = '#e74c3c';
            emailInput.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            emailInput.focus();
            return false;
        }

        if (!senha) {
            showError('Senha é obrigatória');
            senhaInput.style.borderColor = '#e74c3c';
            senhaInput.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            senhaInput.focus();
            return false;
        }

        if (senha.length < 6) {
            showError('Senha deve ter pelo menos 6 caracteres');
            senhaInput.style.borderColor = '#e74c3c';
            senhaInput.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            senhaInput.focus();
            return false;
        }

        return true;
    }

    // Event listener para o formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar campos
        if (!validateFields()) {
            return;
        }

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        console.log(' Tentando fazer login com:', email);

        // Mostrar loading
        showLoading();

        try {
            // Usar o método de login do auth manager
            const result = await auth.login(email, senha);

            if (result.success) {
                console.log(' Login realizado com sucesso:', result.user);
                
                showSuccess('Login realizado com sucesso! Redirecionando...');
                
                // Redirecionar após um breve delay
                setTimeout(() => {
                    window.location.href = 'lista_empresas.html';
                }, 1500);

            } else {
                console.error(' Erro no login:', result.message);
                showError(result.message || 'Credenciais inválidas');
            }

        } catch (error) {
            console.error(' Erro na requisição de login:', error);
            showError('Erro de conexão. Verifique se o servidor está rodando.');
        } finally {
            hideLoading();
        }
    });

    // Limpar erros quando o usuário começar a digitar
    [emailInput, senhaInput].forEach(input => {
        input.addEventListener('input', function() {
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Limpar estilos de erro
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        });

        // Adicionar feedback visual para campos válidos
        input.addEventListener('blur', function() {
            if (input.value.trim()) {
                if (input === emailInput && isValidEmail(input.value.trim())) {
                    input.style.borderColor = '#27ae60';
                    input.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
                } else if (input === senhaInput && input.value.length >= 6) {
                    input.style.borderColor = '#27ae60';
                    input.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
                }
            }
        });
    });

    // Botão "Sobre"
    const btnSobre = document.getElementById('btnSobre');
    if (btnSobre) {
        btnSobre.addEventListener('click', function() {
            alert(`VPE - Sistema de Investimentos
            
Versão: 2.0 (com autenticação JWT)
Desenvolvido para conectar investidores e empresas.

Recursos:
• Sistema de login seguro com JWT
• Cadastro de usuários
• Listagem de empresas
• Dados financeiros protegidos
• Sistema de favoritos
• Área administrativa

Acesso de teste:
Email: admin@vpe.com
Senha: admin123 (caso configurado no seed)`);
        });
    }

    // Adicionar CSS para animações e spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 2px solid white;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        
        input:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
        }
    `;
    document.head.appendChild(style);

    console.log(' Sistema de login com JWT inicializado');
});