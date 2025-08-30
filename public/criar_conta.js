document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.formulario');
    const submitButton = form.querySelector('button[type="submit"]');

    // Função para mostrar mensagem de erro
    function showError(input, message) {
        // Remove error anterior
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Adiciona classe de erro
        input.classList.add('input-error');
        input.classList.remove('input-success');

        // Cria e adiciona mensagem de erro
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    // Função para mostrar sucesso
    function showSuccess(input) {
        // Remove error anterior
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        input.classList.remove('input-error');
        input.classList.add('input-success');
    }

    // Função para limpar validações
    function clearValidation(input) {
        input.classList.remove('input-error', 'input-success');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // Validação de email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validação de senha
    function isValidPassword(password) {
        return password.length >= 6;
    }

    // Validação em tempo real
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            clearValidation(this);
        });
    });

    // Função para validar campo individual
    function validateField(input) {
        const value = input.value.trim();

        switch (input.name) {
            case 'nome':
                if (!value) {
                    showError(input, 'Nome é obrigatório');
                    return false;
                } else if (value.length < 2) {
                    showError(input, 'Nome deve ter pelo menos 2 caracteres');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }

            case 'email':
                if (!value) {
                    showError(input, 'Email é obrigatório');
                    return false;
                } else if (!isValidEmail(value)) {
                    showError(input, 'Email inválido');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }

            case 'senha':
                if (!value) {
                    showError(input, 'Senha é obrigatória');
                    return false;
                } else if (!isValidPassword(value)) {
                    showError(input, 'Senha deve ter pelo menos 6 caracteres');
                    return false;
                } else {
                    showSuccess(input);
                    return true;
                }

            case 'dataNascimento':
                if (!value) {
                    showError(input, 'Data de nascimento é obrigatória');
                    return false;
                } else {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    
                    if (age < 18 || (age === 18 && today < new Date(birthDate.setFullYear(birthDate.getFullYear() + 18)))) {
                        showError(input, 'Você deve ter pelo menos 18 anos');
                        return false;
                    } else {
                        showSuccess(input);
                        return true;
                    }
                }

            default:
                return true;
        }
    }

    // Validação geral do formulário
    function validateForm() {
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    // Função para mostrar loading
    function showLoading() {
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span class="loading-spinner"></span>Criando...';
        submitButton.disabled = true;
    }

    // Função para esconder loading
    function hideLoading() {
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Criar';
        submitButton.disabled = false;
    }

    // Função para mostrar mensagem de sucesso
    function showSuccessMessage() {
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        
        overlay.innerHTML = `
            <div class="success-box">
                <div class="success-icon">✓</div>
                <h3 class="success-title">Conta criada com sucesso!</h3>
                <p class="success-text">Você será redirecionado para a página de login em alguns segundos...</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }

    // Função para mostrar erro geral
    function showErrorAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'error-alert';
        alert.innerHTML = `
            <strong>Erro!</strong> ${message}
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
        `;
        
        document.body.appendChild(alert);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    // Event listener para o formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar formulário
        if (!validateForm()) {
            return;
        }

        // Coletar dados do formulário
        const formData = {
            name: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            senha: document.getElementById('senha').value,
            dataNascimento: document.getElementById('dataNascimento').value
        };

        // Mostrar loading
        showLoading();

        try {
            // Enviar dados para o servidor
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Sucesso
                showSuccessMessage();
            } else {
                // Erro do servidor
                throw new Error(result.message || 'Erro ao criar conta');
            }

        } catch (error) {
            console.error('Erro ao criar conta:', error);
            showErrorAlert(error.message || 'Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            hideLoading();
        }
    });
});