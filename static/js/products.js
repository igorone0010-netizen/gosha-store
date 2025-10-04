// ==================== ФУНКЦИИ ТОВАРОВ И КОРЗИНЫ ====================
function showProducts(category) {
    currentCategory = category;
    currentSection = 'products';
    
    const products = productsData[category] || [];
    displayProducts(products);
    
    // ПОКАЗЫВАЕМ НАВИГАЦИЮ В РАЗДЕЛЕ ТОВАРОВ
    document.getElementById('nav-panel').classList.add('active');
    
    // ПЕРЕИНИЦИАЛИЗИРУЕМ КАРУСЕЛЬ ПРИ ПЕРЕХОДЕ В РАЗДЕЛ
    setTimeout(() => {
        initCarousel();
    }, 100);
    
    navigateToPage('products', 'PlayStation Личный');
    setActiveTab('home');
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">Товары скоро появятся</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.isNew ? `<div class="product-badge">NEW</div>` : ''}
            ${product.discount ? `<div class="product-badge discount">-${product.discount}%</div>` : ''}
            
            <button class="favorite-button ${favorites.some(fav => fav.id === product.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || product.image}')">
                ${favorites.some(fav => fav.id === product.id) ? '❤️' : '🤍'}
            </button>
            
            <div class="product-image">
                ${product.isImage ? 
                    `<img src="${product.imageUrl || product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    (product.image || '🎮')
                }
            </div>
            
            <div class="product-name">${product.name}</div>
            
            <div class="product-prices">
                <div class="product-price">${product.price} руб.</div>
                ${product.originalPrice ? `<div class="product-old-price">${product.originalPrice} руб.</div>` : ''}
            </div>
            
            <button class="buy-button" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || product.image}')">
                Купить
            </button>
        </div>
    `).join('');
}

function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    
    saveCart();
    showNotification(`"${name}" добавлен в корзину`, 'success');
}

function toggleFavorite(id, name, price, image) {
    const index = favorites.findIndex(fav => fav.id === id);
    if (index > -1) {
        favorites.splice(index, 1);
        showNotification(`"${name}" удален из избранного`, 'warning');
    } else {
        favorites.push({ id, name, price, image });
        showNotification(`"${name}" добавлен в избранное`, 'success');
    }
    saveFavorites();
    
    if (currentSection === 'products') {
        displayProducts(productsData[currentCategory]);
    }
}

function updateFavoritesDisplay() {
    const container = document.getElementById('favorites-container');
    
    if (favorites.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">⭐<br><br>Нет избранных товаров</div>';
        return;
    }
    
    container.innerHTML = favorites.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.isImage ? 
                    `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                    product.image
                }
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price} руб.</div>
            <button class="buy-button" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                Купить
            </button>
        </div>
    `).join('');
}

// ==================== ФУНКЦИИ КОРЗИНЫ ====================
function loadCart() {
    const savedCart = localStorage.getItem('goshaStoreCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCart() {
    localStorage.setItem('goshaStoreCart', JSON.stringify(cart));
    updateCartBadge();
}

function loadFavorites() {
    const savedFavorites = localStorage.getItem('goshaStoreFavorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
}

function saveFavorites() {
    localStorage.setItem('goshaStoreFavorites', JSON.stringify(favorites));
}

function updateCartDisplay() {
    const container = document.getElementById('cart-container');
    const totalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state">🛒<br><br>Корзина пуста</div>';
        totalElement.textContent = 'Итого: 0 руб.';
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.textContent = `Итого: ${total} руб.`;
    
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} руб. × ${item.quantity}</div>
            </div>
            <div class="remove-item" onclick="removeFromCart(${index})">🗑️</div>
        </div>
    `).join('');
}

function removeFromCart(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    showNotification(`"${itemName}" удален из корзины`, 'warning');
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTab = document.querySelector('.nav-tab:nth-child(4)');
    
    const oldBadge = cartTab.querySelector('.cart-badge');
    if (oldBadge) oldBadge.remove();
    
    if (totalItems > 0) {
        const badge = document.createElement('div');
        badge.className = 'cart-badge';
        badge.textContent = totalItems > 9 ? '9+' : totalItems;
        cartTab.style.position = 'relative';
        cartTab.appendChild(badge);
    }
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Корзина пуста', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    tg.showPopup({
        title: 'Заказ оформлен!',
        message: `Спасибо за покупку! Сумма: ${total} руб.`
    });
    
    cart = [];
    saveCart();
    updateCartDisplay();
    showNotification('Заказ успешно оформлен!', 'success');
}
