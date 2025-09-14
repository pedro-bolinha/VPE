document.addEventListener('DOMContentLoaded', async function () {
    // Verificar autenticação
    if (!auth.requireAuth()) return;

    // Elementos DOM
    const elements = {
        userName: document.getElementById('userName'),
        userType: document.getElementById('userType'),
        adminBtn: document.getElementById('adminBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        favoritosBtn: document.getElementById('favoritosBtn'),
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        empresasContainer: document.getElementById('empresasContainer'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        favoritosModal: document.getElementById('favoritosModal'),
        closeFavoritos: document.getElementById('closeFavoritos'),
        favoritosContainer: document.getElementById('favoritosContainer')
    };

    // Estado da aplicação
    let state = {
        empresas: [],
        favoritos: [],
        currentUser: null
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
        } catch (error) {
            console.error(' Init error:', error);
            showError('Erro ao carregar dados iniciais');
        }
    }

    // Atualizar interface do usuário
    function updateUserInterface() {
        const { currentUser } = state;
        
        elements.userName.textContent = currentUser.name;
        elements.userType.textContent = currentUser.tipoUsuario;

        // Mostrar botão admin
        if (currentUser.tipoUsuario === 'admin') {
            elements.adminBtn.style.display = 'inline-flex';
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
                console.log(` Loaded ${state.empresas.length} companies`);
            } else {
                throw new Error(data.message || 'Erro ao carregar empresas');
            }
        } catch (error) {
            console.error(' Load companies error:', error);
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
                console.log(`❤️ Loaded ${state.favoritos.length} favorites`);
            }
        } catch (error) {
            console.error(' Load favorites error:', error);
        }
    }

    // Renderizar empresas
    function renderEmpresas(empresasList) {
        if (!empresasList?.length) {
            elements.empresasContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhuma empresa encontrada</h3>
                    <p>Não há empresas disponíveis no momento.</p>
                </div>
            `;
            return;
        }

        const empresasHTML = empresasList.map(empresa => {
            const isFavorito = state.favoritos.some(fav => fav.empresa.id === empresa.id);
            
            return `
                <div class="company" data-empresa-id="${empresa.id}">
                    <img src="${empresa.img}" alt="${empresa.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                    
                    <div class="company-info">
                        <h3>${empresa.name}</h3>
                        <p>${empresa.descricao || 'Descrição não disponível'}</p>
                        
                        <div class="company-meta">
                            <span class="setor">${empresa.setor || 'N/A'}</span>
                            <span class="preco">R$ ${empresa.preco.toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <div class="company-actions">
                            <span class="favorite ${isFavorito ? 'favorited' : ''}" 
                                  data-empresa-id="${empresa.id}">
                                ${isFavorito ? '❤️' : '🤍'}
                            </span>
                            <a class="more-info" href="dados_financeiros.html?empresa=${encodeURIComponent(empresa.name)}">
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
            classes: iconElement.className
        };

        try {
            // UI feedback
            iconElement.style.opacity = '0.5';
            iconElement.style.pointerEvents = 'none';

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
                
                // Recarregar favoritos
                await loadFavoritos();
                
                console.log(`${addToFavorites ? '❤️ Added to' : '💔 Removed from'} favorites:`, empresaId);
            } else {
                throw new Error('Erro ao atualizar favorito');
            }
        } catch (error) {
            console.error(' Toggle favorite error:', error);
            
            // Restaurar estado original
            iconElement.textContent = originalState.text;
            iconElement.className = originalState.classes;
            
            alert('Erro ao atualizar favorito');
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
        console.log(` Filter "${searchTerm}": ${filtered.length} companies found`);
    }

    // Modal de favoritos
    async function showFavoritesModal() {
        elements.favoritosModal.style.display = 'flex';
        
        if (!state.favoritos.length) {
            elements.favoritosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum favorito encontrado</h3>
                    <p>Você ainda não favoritou nenhuma empresa.</p>
                </div>
            `;
            return;
        }

        const favoritosHTML = state.favoritos.map(favorito => `
            <div class="favorite-card">
                <img src="${favorito.empresa.img}" alt="${favorito.empresa.name}"
                     onerror="this.src='https://via.placeholder.com/60x60?text=N/A'">
                <div class="favorite-info">
                    <h4>${favorito.empresa.name}</h4>
                    <p>${favorito.empresa.setor || 'N/A'} - R$ ${favorito.empresa.preco.toLocaleString('pt-BR')}</p>
                    <small>Favoritado: ${new Date(favorito.dataFavoritado).toLocaleDateString('pt-BR')}</small>
                </div>
                <button class="remove-favorite" data-empresa-id="${favorito.empresa.id}">
                    Remover
                </button>
            </div>
        `).join('');

        elements.favoritosContainer.innerHTML = favoritosHTML;

        // Event listeners para remoção
        elements.favoritosContainer.querySelectorAll('.remove-favorite').forEach(button => {
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
                
                // Atualizar ícone principal
                const mainIcon = document.querySelector(`.favorite[data-empresa-id="${empresaId}"]`);
                if (mainIcon) {
                    mainIcon.textContent = '🤍';
                    mainIcon.classList.remove('favorited');
                }
                
                console.log(' Favorite removed:', empresaId);
            }
        } catch (error) {
            console.error(' Remove favorite error:', error);
            alert('Erro ao remover favorito');
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

    // Event Listeners
    elements.logoutBtn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja sair?')) {
            await auth.logout();
        }
    });

    elements.adminBtn.addEventListener('click', () => {
        alert('Área administrativa em desenvolvimento');
    });

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

    elements.favoritosBtn.addEventListener('click', showFavoritesModal);

    elements.closeFavoritos.addEventListener('click', () => {
        elements.favoritosModal.style.display = 'none';
    });

    elements.favoritosModal.addEventListener('click', (e) => {
        if (e.target === elements.favoritosModal) {
            elements.favoritosModal.style.display = 'none';
        }
    });

    // Verificação periódica de token (5 minutos)
    setInterval(async () => {
        const isValid = await auth.verifyToken();
        if (!isValid) {
            alert('Sua sessão expirou. Redirecionando...');
            auth.logout();
        }
    }, 5 * 60 * 1000);

    // Inicializar aplicação
    await init();
    
    console.log(' Company listing system initialized');
});