document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!auth.requireAuth()) return;

    // Elementos DOM
    const elements = {
        loadingState: document.getElementById('loadingState'),
        mainContent: document.getElementById('mainContent'),
        logoutBtn: document.getElementById('logoutBtn'),
        profileForm: document.getElementById('profileForm'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        saveAvatarBtn: document.getElementById('saveAvatarBtn'),
        currentAvatar: document.getElementById('currentAvatar'),
        avatarPlaceholder: document.querySelector('.avatar-placeholder'),
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        userTelefone1: document.getElementById('userTelefone1'),
        userTelefone2: document.getElementById('userTelefone2'),
        userCpfCnpj: document.getElementById('userCpfCnpj'),
        userType: document.getElementById('userType'),
        userCreatedAt: document.getElementById('userCreatedAt')
    };

    // Estado
    let currentUser = null;
    let avatarUploader = null;

    // Inicializar
    async function init() {
        try {
            await loadUserProfile();
            setupEventListeners();
            initializeAvatarUploader();
            showContent();
        } catch (error) {
            console.error('Erro ao inicializar:', error);
            showError('Erro ao carregar perfil');
        }
    }

    // Carregar perfil do usuário
    async function loadUserProfile() {
        try {
            const response = await auth.authenticatedFetch('/api/perfil');
            const data = await response.json();

            if (response.ok && data.success) {
                currentUser = data.usuario;
                populateForm(currentUser);
            } else {
                throw new Error(data.message || 'Erro ao carregar perfil');
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            throw error;
        }
    }

    // Preencher formulário
    function populateForm(user) {
        elements.userName.value = user.name || '';
        elements.userEmail.value = user.email || '';
        elements.userTelefone1.value = user.telefone1 || '';
        elements.userTelefone2.value = user.telefone2 || '';
        elements.userCpfCnpj.value = user.cpfCnpj || '';
        
        // Tipo de usuário
        elements.userType.textContent = user.tipoUsuario;
        const colors = {
            'admin': '#e74c3c',
            'investidor': '#27ae60',
            'empresa': '#f39c12'
        };
        elements.userType.style.backgroundColor = colors[user.tipoUsuario] || '#6c757d';
        
        // Data de criação
        elements.userCreatedAt.value = new Date(user.createdAt).toLocaleDateString('pt-BR');
        
        // Avatar
        if (user.img) {
            elements.currentAvatar.src = user.img;
            elements.currentAvatar.style.display = 'block';
            elements.avatarPlaceholder.style.display = 'none';
        } else {
            elements.currentAvatar.style.display = 'none';
            elements.avatarPlaceholder.style.display = 'block';
        }
    }

    // Inicializar uploader de avatar
    function initializeAvatarUploader() {
        avatarUploader = new ImageUploader({
            type: 'avatar',
            inputId: 'avatarInput',
            previewId: 'avatarPreview',
            buttonId: 'uploadAvatarBtn',
            onSuccess: (file) => {
                console.log('Avatar selecionado:', file);
                elements.saveAvatarBtn.style.display = 'inline-block';
            },
            onError: (error) => {
                console.error('Erro no upload:', error);
                showMessage('Erro ao selecionar imagem', 'error');
            }
        });
    }

    // Salvar avatar
    async function saveAvatar() {
        try {
            showLoading(elements.saveAvatarBtn, 'Salvando...');
            
            const result = await avatarUploader.upload();
            
            if (result) {
                showMessage('Avatar atualizado com sucesso!', 'success');
                elements.saveAvatarBtn.style.display = 'none';
                
                // Atualizar preview
                elements.currentAvatar.src = result.url;
                elements.currentAvatar.style.display = 'block';
                elements.avatarPlaceholder.style.display = 'none';
                
                // Atualizar usuário atual
                currentUser.img = result.url;
                
                // Recarregar após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Erro ao salvar avatar:', error);
            showMessage('Erro ao salvar avatar', 'error');
        } finally {
            hideLoading(elements.saveAvatarBtn, '💾 Salvar Avatar');
        }
    }

    // Salvar perfil
    async function saveProfile(e) {
        e.preventDefault();
        
        try {
            showLoading(elements.saveProfileBtn, 'Salvando...');
            
            const formData = {
                name: elements.userName.value.trim(),
                telefone1: elements.userTelefone1.value.trim(),
                telefone2: elements.userTelefone2.value.trim(),
                cpfCnpj: elements.userCpfCnpj.value.trim()
            };
            
            // Validar nome
            if (!formData.name || formData.name.length < 2) {
                throw new Error('Nome deve ter pelo menos 2 caracteres');
            }
            
            const response = await auth.authenticatedFetch('/api/perfil', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showMessage('Perfil atualizado com sucesso!', 'success');
                currentUser = data.usuario;
                
                // Recarregar após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                throw new Error(data.message || 'Erro ao salvar perfil');
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            showMessage(error.message, 'error');
        } finally {
            hideLoading(elements.saveProfileBtn, '💾 Salvar Alterações');
        }
    }

    // Event Listeners
    function setupEventListeners() {
        elements.logoutBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja sair?')) {
                await auth.logout();
            }
        });
        
        elements.profileForm.addEventListener('submit', saveProfile);
        
        elements.saveAvatarBtn.addEventListener('click', saveAvatar);
        
        // Validação em tempo real
        elements.userName.addEventListener('input', (e) => {
            const length = e.target.value.length;
            e.target.style.borderColor = length >= 2 ? '#27ae60' : '#555';
        });
    }

    // UI Helpers
    function showLoading(button, text = 'Carregando...') {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span> ${text}`;
    }

    function hideLoading(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    function showContent() {
        elements.loadingState.style.display = 'none';
        elements.mainContent.style.display = 'block';
    }

    function showError(message) {
        elements.loadingState.innerHTML = `
            <h2>❌ Erro</h2>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
                🔄 Tentar Novamente
            </button>
        `;
    }

    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `upload-message upload-message-${type}`;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.maxWidth = '400px';
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    // Adicionar CSS do spinner
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
        .spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 2px solid white;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(spinnerStyle);

    // Inicializar aplicação
    await init();
    
    console.log('👤 Página de perfil inicializada');
});