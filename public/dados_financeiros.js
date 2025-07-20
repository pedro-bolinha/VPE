document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Use apenas UMA requisição para a API
    const response = await fetch('/api/empresas');
    const empresas = await response.json();
    const params = new URLSearchParams(window.location.search);
    const nomeEmpresa = params.get('empresa');

    const empresa = empresas.find(e => e.name === nomeEmpresa);
    const empresaInfoDiv = document.getElementById('empresa-info');
    const tabelaContainer = document.getElementById('tabela-container');

    if (empresa) {
      // Renderiza informações da empresa
      empresaInfoDiv.innerHTML = `
        <h2>${empresa.name}</h2>
        <img src="${empresa.img}" style="max-width: 300px; border-radius: 8px;" />
        <p><strong>Descrição:</strong> ${empresa.descricao}</p>
        <p><strong>Preço:</strong> R$ ${empresa.preco.toLocaleString('pt-BR')}</p>
        <p><strong>Setor:</strong> ${empresa.setor}</p>
      `;

      // Renderiza dados financeiros se existirem
      if (empresa.dadosFinanceiros && empresa.dadosFinanceiros.length > 0) {
        const tabela = `
          <h3>Dados Financeiros:</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${empresa.dadosFinanceiros.map(df => `
                <tr>
                  <td>${df.mes}</td>
                  <td>R$ ${df.valor.toLocaleString('pt-BR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tabelaContainer.innerHTML = tabela;
      } else {
        tabelaContainer.innerHTML = '<p>Nenhum dado financeiro disponível.</p>';
      }
    } else {
      empresaInfoDiv.innerHTML = `<p>Empresa não encontrada.</p>`;
      tabelaContainer.innerHTML = '';
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    document.getElementById('empresa-info').innerHTML = `<p>Erro ao carregar dados da empresa.</p>`;
  }
});