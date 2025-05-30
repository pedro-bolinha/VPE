import { empresas } from "./empresa.js";

var divEmpresas = document.querySelector('.empresa');

function createEmpresaCard(empresa) {
  return (
    '<div class="company">' +
      '<img src="' + empresa.img + '" alt="UNI">' +
      '<div class="company-info">' +
        '<h3>' + empresa.name + '</h3>' +
        '<p>' + empresa.descricao + '</p>' +
      '</div>' +
      '<span class="favorite">🤍</span>' +
      '<span class="cart">🛒</span>' +
      '<span class="preco">R$ ' + empresa.preco + '</span>' +
      '<a class="more-info" href="dados_financeiros.html?empresa=' + encodeURIComponent(empresa.name) + '">Mais informações</a>' +
    '</div>'
  );
}

for (var i = 0; i < empresas.length; i++) {
  var card = createEmpresaCard(empresas[i]);
  divEmpresas.insertAdjacentHTML('beforeend', card);
}

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.querySelector('.search-box input');
  var companies = document.querySelectorAll('.company');
  var favoriteIcons = document.querySelectorAll('.favorite');
  var cartIcons = document.querySelectorAll('.cart');
  var buyButton = document.querySelector('.buy-button');
  var moreInfoButtons = document.querySelectorAll('.more-info');

  // Filtro de busca
  searchInput.addEventListener('input', function () {
    var query = searchInput.value.toLowerCase();
    for (var i = 0; i < companies.length; i++) {
      var name = companies[i].querySelector('h3').textContent.toLowerCase();
      companies[i].style.display = name.indexOf(query) !== -1 ? 'flex' : 'none';
    }
  });

  // Favoritar
  for (var i = 0; i < favoriteIcons.length; i++) {
    favoriteIcons[i].addEventListener('click', function () {
      this.textContent = this.textContent === '❤️' ? '🤍' : '❤️';
    });
  }

  // Adicionar ao carrinho
  var cartCount = 0;
  for (var i = 0; i < cartIcons.length; i++) {
    cartIcons[i].addEventListener('click', function () {
      cartCount++;
      alert('Empresa adicionada ao carrinho. Total no carrinho: ' + cartCount);
    });
  }

  // Comprar
  buyButton.addEventListener('click', function () {
    if (cartCount > 0) {
      alert('Compra realizada com sucesso! Total de empresas: ' + cartCount);
      cartCount = 0;
    } else {
      alert('Adicione ao menos uma empresa ao carrinho antes de comprar.');
    }
  });

  // Mais informações
  for (var i = 0; i < moreInfoButtons.length; i++) {
    moreInfoButtons[i].addEventListener('click', function () {
      var nomeEmpresa = this.getAttribute('data-nome');
      alert('Mais informações sobre a ' + nomeEmpresa + ' serão exibidas aqui.');
    });
  }
});
