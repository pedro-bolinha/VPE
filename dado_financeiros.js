const dadosFinanceiros = [
    { mes: 'Janeiro', valor: 25000 },
    { mes: 'Fevereiro', valor: 30000 },
    { mes: 'Março', valor: 18000 },
    { mes: 'Abril', valor: 26000 },
    { mes: 'Maio', valor: 30868 },
    {mes : "Junho", valor: 42000},
    {mes : "Julho", valor: 27920},
    {mes : "Agosto", valor: 18100},
    {mes : "Setembro", valor: 17000},
    {mes : "Outubro", valor: 29000},
    {mes : "Novembro", valor: 50000},
    {mes : "Dezembro", valor: 10000}

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
