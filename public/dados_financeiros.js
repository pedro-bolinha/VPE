document.addEventListener('DOMContentLoaded', async function () {
    // Usar imagens locais de fallback para evitar erros externos de DNS (e.g., via.placeholder.com)
    // Verificar autenticação obrigatória
    if (!auth.requireAuth()) {
        return;
    }

    // Elementos do DOM
    const userNameEl = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const mainContent = document.getElementById('mainContent');
    const empresaInfoDiv = document.getElementById('empresa-info');
    const tabelaContainer = document.getElementById('tabela-container');

    // Variáveis globais
    let currentUser = null;
    let empresaAtual = null;

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
            userNameEl.textContent = currentUser.name;

            // Obter parâmetro da empresa da URL
            const params = new URLSearchParams(window.location.search);
            const nomeEmpresa = params.get('empresa');

            if (!nomeEmpresa) {
                throw new Error('Nome da empresa não especificado na URL');
            }

            // Carregar dados da empresa
            await loadEmpresaData(nomeEmpresa);

        } catch (error) {
            console.error(' Erro na inicialização:', error);
            showError(error.message || 'Erro ao carregar dados iniciais');
        }
    }

    // Carregar dados da empresa
    async function loadEmpresaData(nomeEmpresa) {
        try {
            showLoading();

            // Buscar todas as empresas
            const response = await fetch('/api/empresas');
            
            if (!response.ok) {
                throw new Error('Erro ao comunicar com o servidor');
            }

            const empresas = await response.json();
            
            // Encontrar a empresa específica
            empresaAtual = empresas.find(e => e.name === nomeEmpresa);

            if (!empresaAtual) {
                throw new Error(`Empresa "${nomeEmpresa}" não encontrada`);
            }

            // Renderizar dados da empresa
            renderEmpresaInfo();
            await renderDadosFinanceiros();

            showContent();
            console.log(' Dados da empresa carregados:', empresaAtual.name);

        } catch (error) {
            console.error(' Erro ao carregar empresa:', error);
            showError(error.message || 'Erro ao carregar dados da empresa');
        }
    }

    // Renderizar informações da empresa
    function renderEmpresaInfo() {
        if (!empresaAtual) return;

        empresaInfoDiv.innerHTML = `
            <h2>${empresaAtual.name}</h2>
            <img src="${empresaAtual.img}" 
                 alt="Imagem da ${empresaAtual.name}"
                 onerror="this.src='/images/sem-imagem.svg'">
            <p><strong>Descrição:</strong> ${empresaAtual.descricao || 'Descrição não disponível'}</p>
            <p><strong>Preço:</strong> R$ ${empresaAtual.preco.toLocaleString('pt-BR')}</p>
            <p><strong>Setor:</strong> ${empresaAtual.setor || 'Setor não informado'}</p>
            <p><strong>Data de Cadastro:</strong> ${new Date(empresaAtual.createdAt).toLocaleDateString('pt-BR')}</p>
        `;
    }

    // Renderizar dados financeiros (versão simplificada)
    async function renderDadosFinanceiros() {
        if (!empresaAtual) return;

        try {
            // Verificar se usuário está autenticado para acessar dados financeiros
            const response = await auth.authenticatedFetch(`/api/empresas/${empresaAtual.id}/dados-financeiros`);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Você precisa estar logado para ver dados financeiros detalhados');
                }
                throw new Error('Erro ao carregar dados financeiros');
            }

            const dadosFinanceiros = await response.json();

            if (dadosFinanceiros && dadosFinanceiros.length > 0) {
                const tabelaHTML = `
                    <h3> Dados Financeiros</h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th> Mês</th>
                                    <th> Valor (R$)</th>
                                    <th> Ano</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dadosFinanceiros.map(df => `
                                    <tr>
                                        <td>${df.mes}</td>
                                        <td>R$ ${df.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td>${df.ano}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                tabelaContainer.innerHTML = tabelaHTML;
            } else {
                tabelaContainer.innerHTML = `
                    <h3> Dados Financeiros</h3>
                    <div class="no-data">
                        <p> Ainda não há dados financeiros disponíveis para esta empresa.</p>
                        <p>Os dados serão atualizados conforme ficarem disponíveis.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error(' Erro ao carregar dados financeiros:', error);
            
            // Usar dados financeiros básicos da empresa se houver erro na API específica
            if (empresaAtual.dadosFinanceiros && empresaAtual.dadosFinanceiros.length > 0) {
                const tabelaHTML = `
                    <h3>📊 Dados Financeiros</h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th> Mês</th>
                                    <th> Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${empresaAtual.dadosFinanceiros.map(df => `
                                    <tr>
                                        <td>${df.mes}</td>
                                        <td>R$ ${df.valor.toLocaleString('pt-BR')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                tabelaContainer.innerHTML = tabelaHTML;
            } else {
                tabelaContainer.innerHTML = `
                    <h3> Dados Financeiros</h3>
                    <div class="error-message">
                        <p> ${error.message}</p>
                    </div>
                `;
            }
        }
    }

    // Estados da UI
    function showLoading() {
        loadingState.style.display = 'block';
        errorState.style.display = 'none';
        mainContent.style.display = 'none';
    }

    function showError(message) {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        mainContent.style.display = 'none';
        errorMessage.textContent = message;
    }

    function showContent() {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        mainContent.style.display = 'block';
    }

    // Event Listeners
    
    // Logout
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja sair?')) {
            await auth.logout();
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
    
    console.log(' Dados financeiros com autenticação inicializados');
});