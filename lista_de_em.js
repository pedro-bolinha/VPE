document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-box input');
    const companies = document.querySelectorAll('.company');
    const favoriteIcons = document.querySelectorAll('.favorite');
    const cartIcons = document.querySelectorAll('.cart');
    const buyButton = document.querySelector('.buy-button');

    // Filtro de busca
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        companies.forEach(company => {
            const name = company.querySelector('h3').textContent.toLowerCase();
            company.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });

    // Favoritar
    favoriteIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            icon.textContent = icon.textContent === '❤️' ? '🤍' : '❤️';
        });
    });

    // Adicionar ao carrinho (exemplo simples com contador visual)
    let cartCount = 0;
    cartIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            cartCount++;
            alert(`Empresa adicionada ao carrinho. Total no carrinho: ${cartCount}`);
        });
    });

    // Comprar
    buyButton.addEventListener('click', () => {
        if (cartCount > 0) {
            alert(`Compra realizada com sucesso! Total de empresas: ${cartCount}`);
            cartCount = 0;
        } else {
            alert('Adicione ao menos uma empresa ao carrinho antes de comprar.');
        }
    });
});
