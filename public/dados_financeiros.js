document.addEventListener('DOMContentLoaded', async function () {
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

            // Buscar todas as empresas (poderia ser otimizado para buscar apenas uma)
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
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
            <p><strong>Descrição:</strong> ${empresaAtual.descricao || 'Descrição não disponível'}</p>
            <p><strong>Preço:</strong> R$ ${empresaAtual.preco.toLocaleString('pt-BR')}</p>
            <p><strong>Setor:</strong> ${empresaAtual.setor || 'Setor não informado'}</p>
            <p><strong>Data de Cadastro:</strong> ${new Date(empresaAtual.createdAt).toLocaleDateString('pt-BR')}</p>
        `;
    }

    // Renderizar dados financeiros
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
                    <h3> Dados Financeiros Detalhados</h3>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th> Mês</th>
                                    <th> Valor (R$)</th>
                                    <th> Ano</th>
                                    <th> Crescimento</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${dadosFinanceiros.map((df, index) => {
                                    const valorAnterior = index > 0 ? dadosFinanceiros[index - 1].valor : df.valor;
                                    const crescimento = index > 0 ? ((df.valor - valorAnterior) / valorAnterior * 100) : 0;
                                    const crescimentoClass = crescimento > 0 ? 'positive' : crescimento < 0 ? 'negative' : 'neutral';
                                    const crescimentoIcon = crescimento > 0 ? '📈' : crescimento < 0 ? '📉' : '➖';
                                    
                                    return `
                                        <tr>
                                            <td>${df.mes}</td>
                                            <td>R$ ${df.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td>${df.ano}</td>
                                            <td class="${crescimentoClass}">
                                                ${crescimentoIcon} ${index > 0 ? crescimento.toFixed(1) + '%' : 'Base'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Resumo estatístico -->
                    <div class="financial-summary">
                        <h4> Resumo Estatístico</h4>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <strong> Receita Total:</strong>
                                <span>R$ ${dadosFinanceiros.reduce((sum, df) => sum + df.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="summary-item">
                                <strong> Média Mensal:</strong>
                                <span>R$ ${(dadosFinanceiros.reduce((sum, df) => sum + df.valor, 0) / dadosFinanceiros.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="summary-item">
                                <strong> Maior Valor:</strong>
                                <span>R$ ${Math.max(...dadosFinanceiros.map(df => df.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="summary-item">
                                <strong> Menor Valor:</strong>
                                <span>R$ ${Math.min(...dadosFinanceiros.map(df => df.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
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
                    <h3> Dados Financeiros</h3>
                    <p style="color: #f39c12; margin-bottom: 20px;">
                        ⚠️ Mostrando dados básicos (dados detalhados requerem login)
                    </p>
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

    // Adicionar estilos CSS dinâmicos para o resumo
    const style = document.createElement('style');
    style.textContent = `
        .financial-summary {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
            border-left: 4px solid #007BFF;
        }
        
        .financial-summary h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .summary-item strong {
            color: #495057;
            font-size: 14px;
        }
        
        .summary-item span {
            color: #007BFF;
            font-size: 18px;
            font-weight: 600;
        }
        
        .positive { color: #27ae60 !important; }
        .negative { color: #e74c3c !important; }
        .neutral { color: #6c757d !important; }
        
        .no-data {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .error-message {
            text-align: center;
            padding: 20px;
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
            border-radius: 8px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .summary-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);

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