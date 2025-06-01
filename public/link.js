document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Corrige a URL do fetch
    const response = await fetch('/empresas');
    const empresas = await response.json();

    // Pega o nome da empresa da URL
    const params = new URLSearchParams(window.location.search);
    const nomeEmpresa = params.get('empresa');

    // Encontra a empresa correspondente
    const empresa = empresas.find(e => e.name === nomeEmpresa);

    const empresaInfoDiv = document.getElementById('empresa-info');

    if (empresa) {
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
      empresaInfoDiv.innerHTML = `<p>Empresa não encontrada.</p>`;
    }
  } catch (error) {
    console.error('Erro ao carregar os dados:', error);
  }
});
