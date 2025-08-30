document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('nome');
    const senhaInput = document.getElementById('senha');

    // Função para mostrar loading
    function showLoading() {
        submitButton.innerHTML = 'Entrando...';
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

    // Função para fazer logout (limpar dados salvos)
    function logout() {
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('usuario');
        console.log('Usuário deslogado');
    }

    // Event listener para o formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar campos
        if (!validateFields()) {
            return;
        }

        // Coletar dados do formulário
        const loginData = {
            email: emailInput.value.trim(),
            senha: senhaInput.value
        };

        console.log('Tentando fazer login com:', loginData.email);

        // Mostrar loading
        showLoading();

        try {
            // Enviar dados para o servidor
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();
            console.log('Resposta do servidor:', result);

            if (response.ok && result.success) {
                // Login bem-sucedido
                console.log('Login realizado com sucesso:', result.usuario);
                
                showSuccess('Login realizado com sucesso! Redirecionando...');
                
                // Salvar dados do usuário no localStorage
                localStorage.setItem('usuario', JSON.stringify(result.usuario));
                localStorage.setItem('loginTime', new Date().toISOString());
                
                // Redirecionar após um breve delay para mostrar a mensagem
                setTimeout(() => {
                    window.location.href = 'lista_empresas.html';
                }, 1500);

            } else {
                // Erro no login
                console.error('Erro no login:', result.message);
                throw new Error(result.message || 'Credenciais inválidas');
            }

        } catch (error) {
            console.error('Erro na requisição de login:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showError('Erro de conexão. Verifique se o servidor está rodando.');
            } else {
                showError(error.message || 'Erro ao conectar com o servidor. Tente novamente.');
            }
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

    // Verificar se há um usuário já logado
    const usuarioLogado = localStorage.getItem('usuario');
    if (usuarioLogado) {
        try {
            const usuario = JSON.parse(usuarioLogado);
            const loginTime = localStorage.getItem('loginTime');
            
            console.log('Usuário encontrado no localStorage:', usuario);
            
            // Verificar se o login não é muito antigo (24 horas)
            if (loginTime) {
                const loginDate = new Date(loginTime);
                const now = new Date();
                const hoursAgo = (now - loginDate) / (1000 * 60 * 60);
                
                if (hoursAgo < 24) {
                    // Mostrar opção para continuar logado
                    const continueDiv = document.createElement('div');
                    continueDiv.style.cssText = `
                        background: rgba(52, 152, 219, 0.1);
                        border: 1px solid #3498db;
                        padding: 12px;
                        border-radius: 8px;
                        margin: 15px 0;
                        text-align: center;
                        font-size: 14px;
                    `;
                    continueDiv.innerHTML = `
                        <p style="margin: 0 0 10px 0; color: #3498db;">
                            <strong>Olá, ${usuario.name}!</strong><br>
                            Você ainda está logado. Deseja continuar?
                        </p>
                        <button type="button" onclick="window.location.href='lista_empresas.html'" 
                                style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">
                            Continuar
                        </button>
                        <button type="button" onclick="this.parentElement.remove(); localStorage.removeItem('usuario'); localStorage.removeItem('loginTime');" 
                                style="background: #95a5a6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            Novo Login
                        </button>
                    `;
                    
                    form.insertBefore(continueDiv, form.firstChild);
                }
            }
        } catch (e) {
            console.error('Erro ao verificar usuário logado:', e);
            // Limpar dados corrompidos
            logout();
        }
    }

    // Adicionar CSS para animações
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
        
        input:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
        }
    `;
    document.head.appendChild(style);

    console.log('Sistema de login inicializado');
});