document.addEventListener('DOMContentLoaded', async function () {
  try {
    const response = await fetch('/api/empresas');
    const empresas = await response.json();
    const divEmpresas = document.querySelector('.empresas');

    // Limpa o container antes de adicionar os cards
    divEmpresas.innerHTML = '';

    empresas.forEach(empresa => {
      const card = `
        <div class="company">
          <img src="${empresa.img}" alt="Imagem da ${empresa.name}">
          <div class="company-info">
            <h3>${empresa.name}</h3>
            <p>${empresa.descricao}</p>
            <span class="setor">Setor: ${empresa.setor}</span>
          </div>
          <span class="favorite">🤍</span>
          <a class="more-info" href="dados_financeiros.html?empresa=${encodeURIComponent(empresa.name)}">Mais informações</a>
        </div>`;
      divEmpresas.insertAdjacentHTML('beforeend', card);
    });

    // Adicionar eventos aos ícones de favorito após renderizar os cards
    document.querySelectorAll('.favorite').forEach(icon => {
      icon.addEventListener('click', () => {
        icon.textContent = icon.textContent === '❤️' ? '🤍' : '❤️';
      });
    });
  } catch (error) {
    console.error('Erro ao carregar empresas:', error);
    document.querySelector('.empresas').innerHTML = '<p>Erro ao carregar empresas.</p>';
  }
});