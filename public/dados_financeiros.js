document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch('/empresas');
    const empresas = await response.json();
    const params = new URLSearchParams(window.location.search);
    const nomeEmpresa = params.get('empresa');

    const empresa = empresas.find(e => e.name === nomeEmpresa);
    const empresaInfoDiv = document.getElementById('empresa-info');

    if (empresa) {
      empresaInfoDiv.innerHTML = `
        <h2>${empresa.name}</h2>
        <img src="${empresa.img}" style="max-width: 300px;" />
        <p><strong>Descrição:</strong> ${empresa.descricao}</p>
        <p><strong>Preço:</strong> R$ ${empresa.preco.toLocaleString('pt-BR')}</p>
      `;

      if (empresa.dadosFinanceiros) {
        const tabela = `
          <h3>Dados Financeiros:</h3>
          <table border="1">
            <thead><tr><th>Mês</th><th>Valor</th></tr></thead>
            <tbody>
              ${empresa.dadosFinanceiros.map(df => `
                <tr><td>${df.mes}</td><td>R$ ${df.valor.toLocaleString('pt-BR')}</td></tr>
              `).join('')}
            </tbody>
          </table>
        `;
        document.getElementById('tabela-container').innerHTML = tabela;
      }
    } else {
      empresaInfoDiv.innerHTML = `<p>Empresa não encontrada.</p>`;
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
});
