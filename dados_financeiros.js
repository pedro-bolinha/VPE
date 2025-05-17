import { empresas } from './empresas.js';

// Função para criar a tabela financeira de uma empresa específica
function criarTabelaFinanceira(empresaSelecionada) {
    const container = document.getElementById('tabela-container');

    const tabela = document.createElement('table');
    tabela.classList.add('tabela-financeira');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Mês</th>
            <th>Valor (R$)</th>
        </tr>
    `;
    tabela.appendChild(thead);

    const tbody = document.createElement('tbody');
    
    // Pega os dados financeiros da empresa específica
    empresaSelecionada.dadosFinanceiros.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.mes}</td>
            <td>R$ ${item.valor.toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(tr);
    });

    tabela.appendChild(tbody);

    container.appendChild(tabela);
}

// Exemplo de uso: Criar tabela para a "FAMPEPAR"
const empresaSelecionada = empresas.find(empresa => empresa.name === "FAMPEPAR");
criarTabelaFinanceira(empresaSelecionada);
