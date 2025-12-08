document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticação
    if (!auth.requireAuth()) return;

    // Elementos DOM
    const elements = {
        userName: document.getElementById('userName'),
        userType: document.getElementById('userType'),
        adminBtn: document.getElementById('adminBtn'),
        addCompanyBtn: document.getElementById('addCompanyBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        favoritosBtn: document.getElementById('favoritosBtn'),
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        empresasContainer: document.getElementById('empresasContainer'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        favoritosModal: document.getElementById('favoritosModal'),
        closeFavoritos: document.getElementById('closeFavoritos'),
        favoritosContainer: document.getElementById('favoritosContainer'),
        // Modal de adicionar empresa
        addCompanyModal: document.getElementById('addCompanyModal'),
        closeAddCompany: document.getElementById('closeAddCompany'),
        addCompanyForm: document.getElementById('addCompanyForm'),
        addCompanyAlerts: document.getElementById('addCompanyAlerts'),
        financialDataContainer: document.getElementById('financialDataContainer'),
        addFinancialBtn: document.getElementById('addFinancialBtn'),
        cancelAddCompany: document.getElementById('cancelAddCompany'),
        submitAddCompany: document.getElementById('submitAddCompany'),
        userEmail: document.getElementById('userEmail')
    }; 

    // Estado da aplicação
    let state = {
        empresas: [],
        favoritos: [],
        currentUser: null,
        financialDataCount: 0
    };

    // Inicializar
    async function init() {
        try {
            state.currentUser = auth.getCurrentUser();
            if (!state.currentUser) {
                auth.logout();
                return;
            }

            updateUserInterface();
            await Promise.all([loadEmpresas(), loadFavoritos()]);
            setupEventListeners();
            setupImageUpload();
        } catch (error) {
            console.error(' Init error:', error);
            showError('Erro ao carregar dados iniciais');
        }
    }
    // 6. MODIFICAR lista_empresas.js - ADICIONAR LÓGICA
// ============================================
// Adicionar após a função setupEventListeners():

// Estado para controle de upload
// SUBSTITUIR A FUNÇÃO setupImageUpload() no lista_empresas.js

// Estado para controle de upload
let uploadedImageFile = null;
let uploadedImageUrl = null;

// Configurar upload de imagem
function setupImageUpload() {
  const fileInput = document.getElementById('companyImg');
  const uploadTrigger = document.getElementById('uploadTrigger');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImage');
  const uploadedImageUrlInput = document.getElementById('uploadedImageUrl');

  if (!fileInput || !uploadTrigger || !imagePreview || !previewImg || !removeImageBtn) {
    console.warn('⚠️ Elementos de upload não encontrados');
    return;
  }

  // Trigger para abrir seleção de arquivo
  uploadTrigger.addEventListener('click', () => {
    fileInput.click();
  });

  // Quando arquivo é selecionado
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('Formato de imagem não suportado. Use JPG, PNG, GIF ou WEBP.', 'error');
      fileInput.value = '';
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Imagem muito grande. Tamanho máximo: 5MB', 'error');
      fileInput.value = '';
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreview.style.display = 'block';
      uploadTrigger.style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Armazenar arquivo para upload posterior
    uploadedImageFile = file;
    uploadedImageUrl = null;
    
    console.log('📷 Imagem selecionada:', file.name);
  });

  // Remover imagem
  removeImageBtn.addEventListener('click', () => {
    fileInput.value = '';
    uploadedImageFile = null;
    uploadedImageUrl = null;
    if (uploadedImageUrlInput) {
      uploadedImageUrlInput.value = '';
    }
    imagePreview.style.display = 'none';
    uploadTrigger.style.display = 'inline-flex';
    
    console.log('🗑️ Imagem removida');
  });
}

// Função para fazer upload da imagem ANTES de criar empresa
async function uploadCompanyImage() {
  if (!uploadedImageFile) {
    console.log('ℹ️ Nenhuma imagem para upload');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('image', uploadedImageFile);

    console.log('📤 Iniciando upload da imagem...');

    const response = await fetch('/api/upload/empresa-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no upload');
    }

    const result = await response.json();
    console.log('✅ Upload concluído:', result.imageUrl);
    
    return result.imageUrl;

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
}

// SUBSTITUIR a função submitAddCompanyForm
async function submitAddCompanyForm(event) {
  event.preventDefault();
  clearAlerts();

  try {
    elements.submitAddCompany.disabled = true;
    elements.submitAddCompany.innerHTML = '⏳ Processando...';

    // 1. Fazer upload da imagem primeiro (se houver)
    let imageUrl = null;
    if (uploadedImageFile) {
      elements.submitAddCompany.innerHTML = '📷 Enviando imagem...';
      imageUrl = await uploadCompanyImage();
      console.log('✅ URL da imagem:', imageUrl);
    }

    // 2. Coletar dados do formulário
    const formData = new FormData(elements.addCompanyForm);
    const companyData = {
      name: formData.get('name')?.trim(),
      descricao: formData.get('descricao')?.trim(),
      img: imageUrl || 'https://via.placeholder.com/300x200?text=Nova+Empresa',
      preco: parseFloat(formData.get('preco')),
      setor: formData.get('setor') || 'Outros'
    };

    console.log('📋 Dados da empresa:', companyData);

    // 3. Validar dados
    const errors = validateAddCompanyForm(companyData);
    let financialData = [];
    try {
      financialData = collectFinancialData();
    } catch (financialError) {
      errors.push(financialError.message);
    }

    if (errors.length > 0) {
      errors.forEach(error => showAlert(error, 'error'));
      return;
    }

    // 4. Confirmar cadastro
    const confirmMessage = `
      Confirmar cadastro da empresa "${companyData.name}"?
      
      • Setor: ${companyData.setor}
      • Investimento: R$ ${companyData.preco.toLocaleString('pt-BR')}
      ${imageUrl ? '• Imagem: ✅ Enviada' : '• Imagem: ❌ Não enviada'}
      ${financialData.length > 0 ? `• Dados financeiros: ${financialData.length} meses` : ''}
    `;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // 5. Criar empresa
    elements.submitAddCompany.innerHTML = '💼 Criando empresa...';
    const response = await auth.authenticatedFetch('/api/empresas', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao cadastrar empresa');
    }

    showAlert('✅ Empresa cadastrada com sucesso!', 'success');

    // 6. Adicionar dados financeiros se houver
    if (financialData.length > 0) {
      try {
        elements.submitAddCompany.innerHTML = '📊 Adicionando dados financeiros...';
        const financialResponse = await auth.authenticatedFetch(
          `/api/empresas/${result.id}/dados-financeiros`, 
          {
            method: 'POST',
            body: JSON.stringify({ dadosFinanceiros: financialData })
          }
        );

        if (financialResponse.ok) {
          showAlert('📊 Dados financeiros adicionados!', 'success');
        }
      } catch (financialError) {
        console.warn('⚠️ Erro nos dados financeiros:', financialError);
        showAlert('⚠️ Empresa criada, mas dados financeiros não foram salvos', 'warning');
      }
    }
    
    // 7. Recarregar lista e fechar modal
    await loadEmpresas();
    
    setTimeout(() => {
      hideAddCompanyModal();
      showTemporaryMessage('🎉 Sua empresa foi cadastrada e já aparece na lista!', 'success');
    }, 2000);

    console.log('✅ Nova empresa cadastrada:', result.name);

  } catch (error) {
    console.error('❌ Erro ao cadastrar empresa:', error);
    showAlert(error.message || 'Erro ao cadastrar empresa', 'error');
  } finally {
    elements.submitAddCompany.disabled = false;
    elements.submitAddCompany.innerHTML = '💼 Cadastrar Empresa';
  }
}

    // Atualizar interface do usuário
    function updateUserInterface() {
        const { currentUser } = state;
        
        elements.userName.textContent = currentUser.name;
        elements.userType.textContent = currentUser.tipoUsuario;

        // Mostrar botões baseado no tipo de usuário
        if (currentUser.tipoUsuario === 'admin') {
            elements.adminBtn.style.display = 'inline-flex';
        }

        // TODOS os usuários podem adicionar empresas
        elements.addCompanyBtn.style.display = 'inline-flex';

        // Atualizar email no modal
        if (elements.userEmail) {
            elements.userEmail.textContent = currentUser.email;
        }

        // Cores do tipo de usuário
        const colors = {
            'admin': '#e74c3c',
            'investidor': '#27ae60', 
            'empresa': '#f39c12'
        };
        elements.userType.style.backgroundColor = colors[currentUser.tipoUsuario] || '#6c757d';
    }

    // Carregar empresas
    async function loadEmpresas() {
        try {
            showLoading();
            
            const response = await fetch('/api/empresas');
            const data = await response.json();

            if (response.ok) {
                state.empresas = data;
                renderEmpresas(state.empresas);
                console.log(` Carregadas ${state.empresas.length} empresas`);
            } else {
                throw new Error(data.message || 'Erro ao carregar empresas');
            }
        } catch (error) {
            console.error(' Erro ao carregar empresas:', error);
            showError('Erro ao carregar empresas');
        } finally {
            hideLoading();
        }
    }

    // Carregar favoritos
    async function loadFavoritos() {
        try {
            const response = await auth.authenticatedFetch('/api/favoritos');
            const data = await response.json();

            if (response.ok) {
                state.favoritos = data;
                console.log(`❤️ Carregados ${state.favoritos.length} favoritos`);
            }
        } catch (error) {
            console.error(' Erro ao carregar favoritos:', error);
        }
    }

    // Renderizar empresas
    function renderEmpresas(empresasList) {
        if (!empresasList?.length) {
            elements.empresasContainer.innerHTML = `
                <div class="empty-state">
                    <h3> Nenhuma empresa encontrada</h3>
                    <p>Seja o primeiro a cadastrar sua empresa!</p>
                    <p>Clique em "Adicionar Empresa" para começar.</p>
                </div>
            `;
            return;
        }

        const empresasHTML = empresasList.map(empresa => {
            const isFavorito = state.favoritos.some(fav => fav.empresa.id === empresa.id);
            
            return `
                <div class="company" data-empresa-id="${empresa.id}">
                    <img src="${empresa.img || 'https://via.placeholder.com/300x200?text=Empresa'}" 
                         alt="${empresa.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                    
                    <div class="company-info">
                        <h3>${empresa.name}</h3>
                        <p>${empresa.descricao || 'Descrição não disponível'}</p>
                        
                        <div class="company-meta">
                            <span class="setor">${empresa.setor || 'Outros'}</span>
                            <span class="preco">R$ ${empresa.preco.toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <div class="company-actions">
                            <span class="favorite ${isFavorito ? 'favorited' : ''}" 
                                  data-empresa-id="${empresa.id}"
                                  title="${isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                ${isFavorito ? '❤️' : '🤍'}
                            </span>
                            <a class="more-info" href="dados_financeiros.html?empresa=${encodeURIComponent(empresa.name)}"
                               title="Ver dados financeiros detalhados">
                                 Mais informações
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        elements.empresasContainer.innerHTML = empresasHTML;
        addFavoriteEventListeners();
    }

    // Event listeners para favoritos
    function addFavoriteEventListeners() {
        document.querySelectorAll('.favorite').forEach(icon => {
            icon.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const empresaId = parseInt(icon.dataset.empresaId);
                const isFavorited = icon.classList.contains('favorited');
                
                await toggleFavorite(empresaId, !isFavorited, icon);
            });
        });
    }

    // Toggle favorito
    async function toggleFavorite(empresaId, addToFavorites, iconElement) {
        const originalState = {
            text: iconElement.textContent,
            classes: iconElement.className,
            title: iconElement.title
        };

        try {
            // UI feedback
            iconElement.style.opacity = '0.5';
            iconElement.style.pointerEvents = 'none';
            iconElement.textContent = '';

            const response = addToFavorites
                ? await auth.authenticatedFetch('/api/favoritos', {
                    method: 'POST',
                    body: JSON.stringify({ empresaId })
                })
                : await auth.authenticatedFetch(`/api/favoritos/${empresaId}`, {
                    method: 'DELETE'
                });

            if (response.ok) {
                // Atualizar UI
                iconElement.textContent = addToFavorites ? '❤️' : '🤍';
                iconElement.classList.toggle('favorited', addToFavorites);
                iconElement.title = addToFavorites ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
                
                // Recarregar favoritos
                await loadFavoritos();
                
                console.log(`${addToFavorites ? '❤️ Adicionado aos' : '🤍 Removido dos'} favoritos:`, empresaId);
            } else {
                throw new Error('Erro ao atualizar favorito');
            }
        } catch (error) {
            console.error(' Erro no favorito:', error);
            
            // Restaurar estado original
            iconElement.textContent = originalState.text;
            iconElement.className = originalState.classes;
            iconElement.title = originalState.title;
            
            showTemporaryMessage('Erro ao atualizar favorito', 'error');
        } finally {
            iconElement.style.opacity = '1';
            iconElement.style.pointerEvents = 'auto';
        }
    }

    // Filtrar empresas
    function filterEmpresas(searchTerm) {
        const filtered = searchTerm 
            ? state.empresas.filter(empresa =>
                empresa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                empresa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                empresa.setor?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : state.empresas;

        renderEmpresas(filtered);
        console.log(`🔍 Filtro "${searchTerm}": ${filtered.length} empresas encontradas`);
    }

    // Modal de favoritos
    async function showFavoritesModal() {
        elements.favoritosModal.style.display = 'flex';
        
        if (!state.favoritos.length) {
            elements.favoritosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>💔 Nenhum favorito encontrado</h3>
                    <p>Você ainda não favoritou nenhuma empresa.</p>
                    <p>Explore as empresas e adicione suas favoritas!</p>
                </div>
            `;
            return;
        }

        const favoritosHTML = state.favoritos.map(favorito => `
            <div class="favorite-card">
                <img src="${favorito.empresa.img || 'https://via.placeholder.com/80x80?text=Logo'}" 
                     alt="${favorito.empresa.name}"
                     onerror="this.src='https://via.placeholder.com/80x80?text=N/A'">
                <div class="favorite-info">
                    <h4>${favorito.empresa.name}</h4>
                    <p>${favorito.empresa.setor || 'Setor não informado'} - R$ ${favorito.empresa.preco.toLocaleString('pt-BR')}</p>
                    <small>Favoritado em: ${new Date(favorito.dataFavoritado).toLocaleDateString('pt-BR')}</small>
                </div>
                <button class="remove-favorite" data-empresa-id="${favorito.empresa.id}">
                    🗑️ Remover
                </button>
            </div>
        `).join('');

        elements.favoritosContainer.innerHTML = favoritosHTML;

        // Event listeners para remoção
        elements.favoritosContainer.querySelectorAll('.remove-favorite').forEach(button => {
            button.addEventListener('click', async () => {
                const empresaId = parseInt(button.dataset.empresaId);
                if (confirm('Tem certeza que deseja remover esta empresa dos favoritos?')) {
                    await removeFavoriteFromModal(empresaId);
                }
            });
        });
    }

    // Remover favorito do modal
    async function removeFavoriteFromModal(empresaId) {
        try {
            const response = await auth.authenticatedFetch(`/api/favoritos/${empresaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadFavoritos();
                await showFavoritesModal(); // Recarregar modal
                
                // Atualizar ícone principal
                const mainIcon = document.querySelector(`.favorite[data-empresa-id="${empresaId}"]`);
                if (mainIcon) {
                    mainIcon.textContent = '🤍';
                    mainIcon.classList.remove('favorited');
                    mainIcon.title = 'Adicionar aos favoritos';
                }
                
                console.log('💔 Favorito removido:', empresaId);
            }
        } catch (error) {
            console.error('🚫 Erro ao remover favorito:', error);
            showTemporaryMessage('Erro ao remover favorito', 'error');
        }
    }

    // ===== FUNCIONALIDADES DE ADICIONAR EMPRESA =====

    // Mostrar modal de adicionar empresa
    function showAddCompanyModal() {
        elements.addCompanyModal.style.display = 'flex';
        resetAddCompanyForm();
        clearAlerts();
        
        // Atualizar informações do usuário no modal
        if (elements.userEmail) {
            elements.userEmail.textContent = state.currentUser.email;
        }
    }

    // Esconder modal de adicionar empresa
    function hideAddCompanyModal() {
        elements.addCompanyModal.style.display = 'none';
        resetAddCompanyForm();
        clearAlerts();
    }

    // Resetar formulário
    function resetAddCompanyForm() {
        elements.addCompanyForm.reset();
        elements.financialDataContainer.innerHTML = '';
        state.financialDataCount = 0;
        elements.submitAddCompany.disabled = false;
        elements.submitAddCompany.innerHTML = ' Cadastrar Empresa';
    }

    // Adicionar entrada de dados financeiros
    function addFinancialDataEntry() {
        state.financialDataCount++;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'financial-entry';
        entryDiv.innerHTML = `
            <div class="form-group">
                <label>Mês</label>
                <select name="financial-month-${state.financialDataCount}" required>
                    <option value="">Selecione o mês</option>
                    <option value="Janeiro">Janeiro</option>
                    <option value="Fevereiro">Fevereiro</option>
                    <option value="Março">Março</option>
                    <option value="Abril">Abril</option>
                    <option value="Maio">Maio</option>
                    <option value="Junho">Junho</option>
                    <option value="Julho">Julho</option>
                    <option value="Agosto">Agosto</option>
                    <option value="Setembro">Setembro</option>
                    <option value="Outubro">Outubro</option>
                    <option value="Novembro">Novembro</option>
                    <option value="Dezembro">Dezembro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Faturamento (R$)</label>
                <input type="number" name="financial-value-${state.financialDataCount}" 
                       placeholder="10000.00" min="0" step="0.01" required>
            </div>
            <div>
                <button type="button" class="remove-financial-btn" onclick="removeFinancialEntry(this)" 
                        title="Remover este mês">
                    🗑️
                </button>
            </div>
        `;
        elements.financialDataContainer.appendChild(entryDiv);
        
        // Scroll suave para a nova entrada
        entryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Remover entrada de dados financeiros (função global para onclick)
    window.removeFinancialEntry = function(button) {
        const entry = button.closest('.financial-entry');
        entry.style.opacity = '0.5';
        entry.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            entry.remove();
        }, 300);
    };

    // Coletar dados financeiros do formulário
    function collectFinancialData() {
        const entries = elements.financialDataContainer.querySelectorAll('.financial-entry');
        const financialData = [];
        const usedMonths = new Set();

        entries.forEach((entry, index) => {
            const monthSelect = entry.querySelector(`select[name^="financial-month"]`);
            const valueInput = entry.querySelector(`input[name^="financial-value"]`);
            
            if (monthSelect.value && valueInput.value) {
                // Verificar meses duplicados
                if (usedMonths.has(monthSelect.value)) {
                    throw new Error(`O mês "${monthSelect.value}" foi adicionado mais de uma vez`);
                }
                usedMonths.add(monthSelect.value);

                financialData.push({
                    mes: monthSelect.value,
                    valor: parseFloat(valueInput.value),
                    ano: new Date().getFullYear()
                });
            }
        });

        return financialData;
    }

    // Validar formulário
    function validateAddCompanyForm(formData) {
        const errors = [];

        // Validação do nome
        if (!formData.name || formData.name.trim().length < 2) {
            errors.push('Nome da empresa deve ter pelo menos 2 caracteres');
        }

        if (formData.name && formData.name.trim().length > 100) {
            errors.push('Nome da empresa deve ter no máximo 100 caracteres');
        }

        // Validação da descrição
        if (!formData.descricao || formData.descricao.trim().length < 10) {
            errors.push('Descrição deve ter pelo menos 10 caracteres');
        }

        if (formData.descricao && formData.descricao.trim().length > 1000) {
            errors.push('Descrição deve ter no máximo 1000 caracteres');
        }

        // Validação do preço
        if (!formData.preco || formData.preco < 1000) {
            errors.push('Valor de investimento deve ser pelo menos R$ 1.000');
        }

        if (formData.preco > 100000000) {
            errors.push('Valor de investimento não pode exceder R$ 100.000.000');
        }

        // Validação da URL da imagem
        if (formData.img && !isValidUrl(formData.img)) {
            errors.push('URL da imagem é inválida');
        }

        return errors;
    }

    // Verificar se URL é válida
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return ['http:', 'https:'].includes(url.protocol);
        } catch (_) {
            return false;
        }
    }

    // Mostrar alertas
    function showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <span>${getAlertIcon(type)}</span>
            <span>${message}</span>
        `;
        elements.addCompanyAlerts.appendChild(alertDiv);
        
        // Scroll para o alerta
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Ícones dos alertas
    function getAlertIcon(type) {
        const icons = {
            success: '',
            error: '',
            info: 'ℹ',
            warning: ''
        };
        return icons[type] || '';
    }

    // Limpar alertas
    function clearAlerts() {
        elements.addCompanyAlerts.innerHTML = '';
    }

    // Mostrar mensagem temporária
    function showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.maxWidth = '400px';
        messageDiv.innerHTML = `
            <span>${getAlertIcon(type)}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    // Submeter formulário de nova empresa
    async function submitAddCompanyForm(event) {
        event.preventDefault();
        clearAlerts();

        try {
            // Desabilitar botão de submit
            elements.submitAddCompany.disabled = true;
            elements.submitAddCompany.innerHTML = ' Cadastrando...';

            // Coletar dados do formulário
            const formData = new FormData(elements.addCompanyForm);
            const companyData = {
                name: formData.get('name')?.trim(),
                descricao: formData.get('descricao')?.trim(),
                img: formData.get('img')?.trim() || 'https://via.placeholder.com/300x200?text=Nova+Empresa',
                preco: parseFloat(formData.get('preco')),
                setor: formData.get('setor') || 'Outros'
            };

            // Validar dados básicos
            const errors = validateAddCompanyForm(companyData);
            
            // Validar dados financeiros se houver
            let financialData = [];
            try {
                financialData = collectFinancialData();
            } catch (financialError) {
                errors.push(financialError.message);
            }

            if (errors.length > 0) {
                errors.forEach(error => showAlert(error, 'error'));
                return;
            }

            // Confirmar cadastro
            const confirmMessage = `
                Confirmar cadastro da empresa "${companyData.name}"?
                
                • Setor: ${companyData.setor}
                • Investimento: R$ ${companyData.preco.toLocaleString('pt-BR')}
                ${financialData.length > 0 ? `• Dados financeiros: ${financialData.length} meses` : ''}
            `;
            
            if (!confirm(confirmMessage)) {
                return;
            }

            // Enviar para API
            const response = await auth.authenticatedFetch('/api/empresas', {
                method: 'POST',
                body: JSON.stringify(companyData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao cadastrar empresa');
            }

            showAlert(' Empresa cadastrada com sucesso!', 'success');

            // Se há dados financeiros, adicioná-los
            if (financialData.length > 0) {
                try {
                    const financialResponse = await auth.authenticatedFetch(
                        `/api/empresas/${result.id}/dados-financeiros`, 
                        {
                            method: 'POST',
                            body: JSON.stringify({ dadosFinanceiros: financialData })
                        }
                    );

                    if (financialResponse.ok) {
                        showAlert(' Dados financeiros adicionados com sucesso!', 'success');
                    } else {
                        showAlert(' Empresa criada, mas houve erro nos dados financeiros', 'warning');
                    }
                } catch (financialError) {
                    console.warn(' Erro ao adicionar dados financeiros:', financialError);
                    showAlert(' Empresa criada, mas dados financeiros não foram salvos', 'warning');
                }
            }
            
            // Recarregar lista de empresas
            await loadEmpresas();
            
            // Fechar modal após 2 segundos
            setTimeout(() => {
                hideAddCompanyModal();
                showTemporaryMessage('Sua empresa foi cadastrada e já aparece na lista!', 'success');
            }, 2000);

            console.log(' Nova empresa cadastrada:', result.name);

        } catch (error) {
            console.error(' Erro ao cadastrar empresa:', error);
            showAlert(error.message || 'Erro ao cadastrar empresa', 'error');
        } finally {
            elements.submitAddCompany.disabled = false;
            elements.submitAddCompany.innerHTML = ' Cadastrar Empresa';
        }
    }

    // Estados de UI
    const showLoading = () => {
        elements.loadingState.style.display = 'block';
        elements.errorState.style.display = 'none';
        elements.empresasContainer.style.display = 'none';
    };

    const hideLoading = () => {
        elements.loadingState.style.display = 'none';
        elements.empresasContainer.style.display = 'grid';
    };

    const showError = (message) => {
        elements.errorState.style.display = 'block';
        elements.errorState.querySelector('p').textContent = message;
        elements.loadingState.style.display = 'none';
        elements.empresasContainer.style.display = 'none';
    };

    // Setup Event Listeners
    function setupEventListeners() {
        // Logout
        elements.logoutBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja sair do sistema?')) {
                await auth.logout();
            }
        });

        // Admin (placeholder)
        elements.adminBtn.addEventListener('click', () => {
            showTemporaryMessage('Área administrativa em desenvolvimento', 'info');
        });

        // Busca
        elements.searchBtn.addEventListener('click', () => {
            filterEmpresas(elements.searchInput.value.trim());
        });

        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterEmpresas(elements.searchInput.value.trim());
            }
        });

        elements.searchInput.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                filterEmpresas('');
            }
        });

        // Modal de favoritos
        elements.favoritosBtn.addEventListener('click', showFavoritesModal);
        elements.closeFavoritos.addEventListener('click', () => {
            elements.favoritosModal.style.display = 'none';
        });

        elements.favoritosModal.addEventListener('click', (e) => {
            if (e.target === elements.favoritosModal) {
                elements.favoritosModal.style.display = 'none';
            }
        });

        // Modal de adicionar empresa
        elements.addCompanyBtn.addEventListener('click', showAddCompanyModal);
        elements.closeAddCompany.addEventListener('click', hideAddCompanyModal);
        elements.cancelAddCompany.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
                hideAddCompanyModal();
            }
        });

        elements.addCompanyModal.addEventListener('click', (e) => {
            if (e.target === elements.addCompanyModal) {
                if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
                    hideAddCompanyModal();
                }
            }
        });

        // Formulário de adicionar empresa
        elements.addCompanyForm.addEventListener('submit', submitAddCompanyForm);
        elements.addFinancialBtn.addEventListener('click', addFinancialDataEntry);

        // Validação em tempo real
        const nameInput = document.getElementById('companyName');
        const descInput = document.getElementById('companyDesc');
        const priceInput = document.getElementById('companyPrice');

        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                const counter = e.target.parentNode.querySelector('.char-counter') || 
                    document.createElement('small');
                
                if (!e.target.parentNode.querySelector('.char-counter')) {
                    counter.className = 'char-counter';
                    counter.style.color = length > 80 ? '#e74c3c' : '#999';
                    e.target.parentNode.appendChild(counter);
                }
                
                counter.textContent = `${length}/100 caracteres`;
                counter.style.color = length > 80 ? '#e74c3c' : '#999';
            });
        }

        if (descInput) {
            descInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                const counter = e.target.parentNode.querySelector('.char-counter') || 
                    document.createElement('small');
                
                if (!e.target.parentNode.querySelector('.char-counter')) {
                    counter.className = 'char-counter';
                    e.target.parentNode.appendChild(counter);
                }
                
                counter.textContent = `${length}/1000 caracteres`;
                counter.style.color = length > 900 ? '#e74c3c' : '#999';
            });
        }

        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) || 0;
                const feedback = e.target.parentNode.querySelector('.price-feedback') || 
                    document.createElement('small');
                
                if (!e.target.parentNode.querySelector('.price-feedback')) {
                    feedback.className = 'price-feedback';
                    e.target.parentNode.appendChild(feedback);
                }
                
                if (value < 1000) {
                    feedback.textContent = 'Valor mínimo: R$ 1.000';
                    feedback.style.color = '#e74c3c';
                } else {
                    feedback.textContent = `Investimento: R$ ${value.toLocaleString('pt-BR')}`;
                    feedback.style.color = '#27ae60';
                }
            });
        }

        // Verificação periódica de token (10 minutos)
        setInterval(async () => {
            const isValid = await auth.verifyToken();
            if (!isValid) {
                showTemporaryMessage('Sua sessão expirou. Você será redirecionado...', 'warning');
                setTimeout(() => auth.logout(), 3000);
            }
        }, 10 * 60 * 1000);

        // Detectar se o usuário está offline/online
        window.addEventListener('online', () => {
            showTemporaryMessage('Conexão restabelecida!', 'success');
        });

        window.addEventListener('offline', () => {
            showTemporaryMessage('Você está offline. Algumas funcionalidades podem não funcionar.', 'warning');
        });
    }

    // Inicializar aplicação
    await init();
    
    console.log(' Sistema de empresas inicializado - Todos os usuários podem adicionar empresas');
    ;
});