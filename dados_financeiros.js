const dadosFinanceiros = [
    { mes: 'Janeiro', valor: 11572 },
    { mes: 'Fevereiro', valor: 13887 },
    { mes: 'Março', valor: 8332 },
    { mes: 'Abril', valor: 12029 },
    { mes: 'Maio', valor: 14289 },
    { mes: 'Junho', valor: 19442 },
    { mes: 'Julho', valor: 12926 },
    { mes: 'Agosto', valor: 8385 },
    { mes: 'Setembro', valor: 7870 },
    { mes: 'Outubro', valor: 13435 },
    { mes: 'Novembro', valor: 23145 },
    { mes: 'Dezembro', valor: 4626 }
];

function criarTabelaFinanceira() {
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
    dadosFinanceiros.forEach(item => {
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

criarTabelaFinanceira();
