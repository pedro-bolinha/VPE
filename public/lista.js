document.addEventListener('DOMContentLoaded', async function () {
  const response = await fetch('/empresas');
  const empresas = await response.json();
  const divEmpresas = document.querySelector('.empresas');

  empresas.forEach(empresa => {
    const card = `
      <div class="company">
        <img src="${empresa.img}" alt="Imagem">
        <div class="company-info">
          <h3>${empresa.name}</h3>
        </div>
        <span class="favorite">🤍</span>
        <span class="cart">🛒</span>
        <span class="preco">R$ ${empresa.preco.toLocaleString('pt-BR')}</span>
        <a class="more-info" href="dados_financeiros.html?empresa=${encodeURIComponent(empresa.name)}">Mais informações</a>
      </div>`;
    divEmpresas.insertAdjacentHTML('beforeend', card);
  });

  // adicionar eventos aos ícones após renderizar os cards
  document.querySelectorAll('.favorite').forEach(icon => {
    icon.addEventListener('click', () => {
      icon.textContent = icon.textContent === '❤️' ? '🤍' : '❤️';
    });
  });

  let cartCount = 0;
  document.querySelectorAll('.cart').forEach(icon => {
    icon.addEventListener('click', () => {
      cartCount++;
      alert(`Empresa adicionada ao carrinho. Total: ${cartCount}`);
    });
  });

  document.querySelector('.buy-button').addEventListener('click', () => {
    if (cartCount > 0) {
      alert(`Compra realizada! Total: ${cartCount}`);
      cartCount = 0;
    } else {
      alert('Adicione ao menos uma empresa ao carrinho.');
    }
  });
});
