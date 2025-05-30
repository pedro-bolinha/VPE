import { empresas } from './empresas.js';

document.addEventListener('DOMContentLoaded', function() {
    // Pega o nome da empresa da URL
    const params = new URLSearchParams(window.location.search);
    const nomeEmpresa = params.get('empresa');

    // Encontra a empresa correspondente no array de empresas
    const empresa = empresas.find(empresa => empresa.name === nomeEmpresa);

    // Se a empresa for encontrada, exibe os dados financeiros
    if (empresa) {
        const empresaInfoDiv = document.getElementById('empresa-info');
        let infoHTML = `
            <h2>${empresa.name}</h2>
            <p>${empresa.descricao}</p>
            <h3>Dados Financeiros:</h3>
            <table border="1">
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Cria a tabela com os dados financeiros da empresa
        empresa.dadosFinanceiros.forEach(item => {
            infoHTML += `
                <tr>
                    <td>${item.mes}</td>
                    <td>R$ ${item.valor.toLocaleString('pt-BR')}</td>
                </tr>
            `;
        });

        infoHTML += '</tbody></table>';
        empresaInfoDiv.innerHTML = infoHTML;
    } else {
        document.getElementById('empresa-info').innerHTML = `<p>Empresa não encontrada.</p>`;
    }
});
