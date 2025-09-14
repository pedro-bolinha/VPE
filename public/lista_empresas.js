document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticação obrigatória
    if (!auth.requireAuth()) {
        return;
    }

    // Elementos do DOM
    const userNameEl = document.getElementById('userName');
    const userTypeEl = document.getElementById('userType');
    const adminBtn = document.getElementById('adminBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const favoritosBtn = document.getElementById('favoritosBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const empresasContainer = document.getElementById('empresasContainer');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const favoritosModal = document.getElementById('favoritosModal');
    const closeFavoritos = document.getElementById('closeFavoritos');
    const favoritosContainer = document.getElementById('favoritosContainer');

    // Variáveis globais
    let empresas = [];
    let favoritos = [];
    let currentUser = null;

    // Inicializar a aplicação
    async function init() {
        try {
            // Obter dados do usuário
            currentUser = auth.getCurrentUser();
            if (!currentUser) {
                auth.logout();
                return;
            }

            // Atualizar UI do usuário
            updateUserInterface();

            // Carregar empresas e favoritos
            await Promise.all([
                loadEmpresas(),
                loadFavoritos()
            ]);

        } catch (error) {
            console.error(' Erro na inicialização:', error);
            showError('Erro ao carregar dados iniciais');
        }
    }

    // Atualizar interface do usuário
    function updateUserInterface() {
        userNameEl.textContent = currentUser.name;
        userTypeEl.textContent = currentUser.tipoUsuario;

        // Mostrar botão admin apenas para administradores
        if (currentUser.tipoUsuario === 'admin') {
            adminBtn.style.display = 'inline-flex';
        }

        // Definir cor do tipo de usuário
        const typeColors = {
            'admin': '#e74c3c',
            'investidor': '#27ae60',
            'empresa': '#f39c12'
        };
        userTypeEl.style.backgroundColor = typeColors[currentUser.tipoUsuario] || '#6c757d';
    }

    // Carregar empresas
    async function loadEmpresas() {
        try {
            showLoading();

            const response = await fetch('/api/empresas');
            const data = await response.json();

            if (response.ok) {
                empresas = data;
                renderEmpresas(empresas);
                console.log(` Carregadas ${empresas.length} empresas`);
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

    // Carregar favoritos do usuário
    async function loadFavoritos() {
        try {
            const response = await auth.authenticatedFetch('/api/favoritos');
            const data = await response.json();

            if (response.ok) {
                favoritos = data;
                console.log(` Carregados ${favoritos.length} favoritos`);
            } else {
                console.warn('Erro ao carregar favoritos:', data.message);
            }

        } catch (error) {
            console.error(' Erro ao carregar favoritos:', error);
        }
    }

    // Renderizar lista de empresas
    function renderEmpresas(empresasList) {
        if (!empresasList || empresasList.length === 0) {
            empresasContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhuma empresa encontrada</h3>
                    <p>Não há empresas disponíveis no momento.</p>
                </div>
            `;
            return;
        }

        const empresasHTML = empresasList.map(empresa => {
            const isFavorito = favoritos.some(fav => fav.empresa.id === empresa.id);
            const heartIcon = isFavorito ? '❤️' : '🤍';

            return `
                <div class="company" data-empresa-id="${empresa.id}">
                    <img src="${empresa.img}" alt="Imagem da ${empresa.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                    
                    <div class="company-info">
                        <h3>${empresa.name}</h3>
                        <p>${empresa.descricao || 'Descrição não disponível'}</p>
                        
                        <div class="company-meta">
                            <span class="setor">${empresa.setor || 'Setor não informado'}</span>
                            <span class="preco">R$ ${empresa.preco.toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <div class="company-actions">
                            <span class="favorite ${isFavorito ? 'favorited' : ''}" 
                                  data-empresa-id="${empresa.id}" 
                                  title="${isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                ${heartIcon}
                            </span>
                            <a class="more-info" href="dados_financeiros.html?empresa=${encodeURIComponent(empresa.name)}">
                                📊 Mais informações
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        empresasContainer.innerHTML = empresasHTML;

        // Adicionar event listeners para favoritos
        addFavoriteEventListeners();
    }

    // Adicionar event listeners para os corações de favorito
    function addFavoriteEventListeners() {
        const favoriteIcons = document.querySelectorAll('.favorite');
        favoriteIcons.forEach(icon => {
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
        try {
            iconElement.style.pointerEvents = 'none';
            iconElement.style.opacity = '0.5';

            let response;
            if (addToFavorites) {
                response = await auth.authenticatedFetch('/api/favoritos', {
                    method: 'POST',
                    body: JSON.stringify({ empresaId })
                });
            } else {
                response = await auth.authenticatedFetch(`/api/favoritos/${empresaId}`, {
                    method: 'DELETE'
                });
            }

            const result = await response.json();

            if (response.ok) {
                // Atualizar UI
                if (addToFavorites) {
                    iconElement.textContent = '❤️';
                    iconElement.classList.add('favorited');
                    iconElement.title = 'Remover dos favoritos';
                } else {
                    iconElement.textContent = '🤍';
                    iconElement.classList.remove('favorited');
                    iconElement.title = 'Adicionar aos favoritos';
                }

                // Recarregar favoritos
                await loadFavoritos();
                
                console.log(`${addToFavorites ? '❤️ Adicionado aos' : '💔 Removido dos'} favoritos:`, empresaId);
            } else {
                throw new Error(result.message || 'Erro ao atualizar favorito');
            }

        } catch (error) {
            console.error(' Erro ao atualizar favorito:', error);
            alert('Erro ao atualizar favorito: ' + error.message);
        } finally {
            iconElement.style.pointerEvents = 'auto';
            iconElement.style.opacity = '1';
        }
    }

    // Filtrar empresas
    function filterEmpresas(searchTerm) {
        if (!searchTerm) {
            renderEmpresas(empresas);
            return;
        }

        const filtered = empresas.filter(empresa =>
            empresa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (empresa.descricao && empresa.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (empresa.setor && empresa.setor.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        renderEmpresas(filtered);
        console.log(`🔍 Filtro "${searchTerm}": ${filtered.length} empresas encontradas`);
    }

    // Mostrar modal de favoritos
    async function showFavoritesModal() {
        favoritosModal.style.display = 'flex';
        
        if (favoritos.length === 0) {
            favoritosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum favorito encontrado</h3>
                    <p>Você ainda não favoritou nenhuma empresa.</p>
                </div>
            `;
            return;
        }

        const favoritosHTML = favoritos.map(favorito => `
            <div class="favorite-card">
                <img src="${favorito.empresa.img}" alt="${favorito.empresa.name}"
                     onerror="this.src='https://via.placeholder.com/60x60?text=Sem+Imagem'">
                <div class="favorite-info">
                    <h4>${favorito.empresa.name}</h4>
                    <p>${favorito.empresa.setor || 'Setor não informado'} - R$ ${favorito.empresa.preco.toLocaleString('pt-BR')}</p>
                    <small>Favoritado em: ${new Date(favorito.dataFavoritado).toLocaleDateString('pt-BR')}</small>
                </div>
                <button class="remove-favorite" data-empresa-id="${favorito.empresa.id}">
                    Remover
                </button>
            </div>
        `).join('');

        favoritosContainer.innerHTML = favoritosHTML;

        // Adicionar event listeners para remoção
        const removeButtons = favoritosContainer.querySelectorAll('.remove-favorite');
        removeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const empresaId = parseInt(button.dataset.empresaId);
                await removeFavoriteFromModal(empresaId);
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
                
                // Atualizar ícone na lista principal se estiver visível
                const mainIcon = document.querySelector(`.favorite[data-empresa-id="${empresaId}"]`);
                if (mainIcon) {
                    mainIcon.textContent = '🤍';
                    mainIcon.classList.remove('favorited');
                    mainIcon.title = 'Adicionar aos favoritos';
                }
                
                console.log(' Favorito removido:', empresaId);
            } else {
                const result = await response.json();
                throw new Error(result.message);
            }
        } catch (error) {
            console.error(' Erro ao remover favorito:', error);
            alert('Erro ao remover favorito: ' + error.message);
        }
    }

    // Estados de loading e erro
    function showLoading() {
        loadingState.style.display = 'block';
        errorState.style.display = 'none';
        empresasContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingState.style.display = 'none';
        empresasContainer.style.display = 'grid';
    }

    function showError(message) {
        errorState.style.display = 'block';
        errorState.querySelector('p').textContent = message;
        loadingState.style.display = 'none';
        empresasContainer.style.display = 'none';
    }

    // Event Listeners
    
    // Logout
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja sair?')) {
            await auth.logout();
        }
    });

    // Botão admin
    adminBtn.addEventListener('click', () => {
        alert('Área administrativa em desenvolvimento');
        // Aqui você pode redirecionar para painel admin
        // window.location.href = 'admin.html';
    });

    // Pesquisa
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        filterEmpresas(searchTerm);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            filterEmpresas(searchTerm);
        }
    });

    // Limpar pesquisa quando campo for limpo
    searchInput.addEventListener('input', (e) => {
        if (!e.target.value.trim()) {
            filterEmpresas('');
        }
    });

    // Modal de favoritos
    favoritosBtn.addEventListener('click', showFavoritesModal);

    closeFavoritos.addEventListener('click', () => {
        favoritosModal.style.display = 'none';
    });

    // Fechar modal clicando fora
    favoritosModal.addEventListener('click', (e) => {
        if (e.target === favoritosModal) {
            favoritosModal.style.display = 'none';
        }
    });

    // Verificar token periodicamente
    setInterval(async () => {
        const isValid = await auth.verifyToken();
        if (!isValid) {
            alert('Sua sessão expirou. Você será redirecionado para o login.');
            auth.logout();
        }
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    // Inicializar aplicação
    await init();
    
    console.log(' Lista de empresas com autenticação inicializada');
});