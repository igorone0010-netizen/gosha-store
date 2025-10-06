// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.hide();

let productsData = {
    'playstation_personal': []
};

let cart = [];
let currentCategory = '';
let userData = {};
let autoSaveTimeout;
let favorites = [];
let currentSection = '';
let activeInput = null;
let currentPage = 'main';
const pageHistory = [];

// ==================== КАТЕГОРИИ ====================
let productCategories = {};

// ==================== КАРУСЕЛЬ ====================
let featuredGames = [];
let currentSlide = 0;
let autoScrollInterval;

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function setupBackButton() {
    tg.BackButton.hide();
    tg.onEvent('backButtonClicked', function() {
        goBack();
    });
}

function showBackButton(show) {
    if (show) {
        tg.BackButton.show();
    } else {
        tg.BackButton.hide();
    }
}

function navigateToPage(pageId, title = '', addToHistory = true) {
    if (addToHistory && currentPage !== pageId) {
        pageHistory.push({
            page: currentPage,
            title: 'GoshaStore'
        });
    }
    
    hideAllPages();
    document.getElementById(pageId + '-page').classList.add('active');
    
    if (pageId === 'main') {
        showBackButton(false);
        document.getElementById('nav-panel').classList.remove('active');
        document.getElementById('profile-button').classList.remove('active');
    } else {
        showBackButton(true);
        
        if (pageId === 'profile') {
            document.getElementById('profile-button').classList.add('active');
            hideNavPanel();
        } else if (pageId === 'products' || pageId === 'categories' || 
                  pageId === 'cart' || pageId === 'favorites') {
            showNavPanel();
        } else {
            hideNavPanel();
        }
    }
    
    currentPage = pageId;
}

function goBack() {
    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop();
        navigateToPage(previousPage.page, previousPage.title, false);
    } else {
        tg.close();
    }
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
}

function showMain() {
    navigateToPage('main', 'GoshaStore');
}

function showProfile() {
    navigateToPage('profile', 'Профиль');
}

function showHistory() {
    navigateToPage('history', 'История заказов');
}

function showNavPanel() {
    document.getElementById('nav-panel').classList.add('active');
}

function hideNavPanel() {
    document.getElementById('nav-panel').classList.remove('active');
}

function setActiveTab(tabName) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (tabName === 'home') {
        tabs[0].classList.add('active');
    } else if (tabName === 'categories') {
        tabs[1].classList.add('active');
    } else if (tabName === 'favorites') {
        tabs[2].classList.add('active');
    } else if (tabName === 'cart') {
        tabs[3].classList.add('active');
    }
}

function showSectionHome() {
    if (currentSection === 'products') {
        navigateToPage('products', 'PlayStation Личный');
        setActiveTab('home');
    } else {
        showMain();
    }
}

// ==================== ПРОФИЛЬ ====================
function activateInput(type) {
    if (activeInput) {
        deactivateInput(activeInput);
    }
    
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    card.classList.add('active');
    input.focus();
    activeInput = type;
    
    if (input.value.trim()) {
        card.classList.add('has-value');
    }
}

function deactivateInput(type) {
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    if (!input.value.trim()) {
        card.classList.remove('active');
        card.classList.remove('has-value');
    }
    activeInput = null;
}

function handleInputChange(type) {
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    if (input.value.trim()) {
        card.classList.add('has-value');
    } else {
        card.classList.remove('has-value');
    }
    
    autoSaveData();
}

function initUser() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        const firstName = user.first_name || 'Пользователь';
        document.getElementById('profile-welcome').textContent = `Привет, ${firstName}!`;
        document.getElementById('profile-button').textContent = firstName;
        loadUserData();
    } else {
        document.getElementById('profile-welcome').textContent = 'Привет!';
        document.getElementById('profile-button').textContent = 'Профиль';
    }
    
    loadCart();
    loadFavorites();
    updateCartBadge();
}

function loadUserData() {
    const savedData = localStorage.getItem('goshaStoreUserData');
    if (savedData) {
        userData = JSON.parse(savedData);
        
        if (userData.email) {
            document.getElementById('user-email').value = userData.email;
            document.getElementById('email-card').classList.add('has-value');
        }
        if (userData.password) {
            document.getElementById('user-password').value = userData.password;
            document.getElementById('password-card').classList.add('has-value');
        }
        if (userData.twoFA) {
            document.getElementById('user-2fa').value = userData.twoFA;
            document.getElementById('2fa-card').classList.add('has-value');
        }
    }
}

function autoSaveData() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        userData = {
            email: document.getElementById('user-email').value,
            password: document.getElementById('user-password').value,
            twoFA: document.getElementById('user-2fa').value,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('goshaStoreUserData', JSON.stringify(userData));
    }, 1000);
}

// ==================== КАТЕГОРИИ И ТОВАРЫ ====================
function initCategories() {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
        productCategories = JSON.parse(savedCategories);
    } else {
        createDefaultCategories();
    }
}

function createDefaultCategories() {
    productCategories = {
        'playstation_personal': {
            name: 'PlayStation Личный',
            subcategories: {
                'carousel': {
                    name: 'Горячие предложения',
                    type: 'carousel',
                    products: []
                }
            }
        }
    };
    saveCategories();
}

function saveCategories() {
    localStorage.setItem('productCategories', JSON.stringify(productCategories));
}

function loadCategories() {
    const categories = [
        { name: 'Экшн', icon: '🔫' },
        { name: 'Приключения', icon: '🗺️' },
        { name: 'RPG', icon: '⚔️' },
        { name: 'Стратегии', icon: '♟️' },
        { name: 'Спорт', icon: '⚽' },
        { name: 'Гонки', icon: '🏎️' }
    ];
    
    const container = document.getElementById('categories-container');
    container.innerHTML = categories.map(category => `
        <div class="category-card" onclick="searchByCategory('${category.name}')">
            <div class="category-icon">${category.icon}</div>
            <div class="category-name">${category.name}</div>
        </div>
    `).join('');
}

function showCategories() {
    navigateToPage('categories', 'Категории игр');
    setActiveTab('categories');
    loadCategories();
}

function showProducts(category) {
    currentCategory = category;
    currentSection = 'products';
    
    const products = productsData[category] || [];
    
    document.getElementById('nav-panel').classList.add('active');
    
    setTimeout(() => {
        initCarousel();
    }, 100);
    
    navigateToPage('products', 'PlayStation Личный');
    setActiveTab('home');
    
    // ПОКАЗЫВАЕМ ПОДКАТЕГОРИИ ПОД КАРУСЕЛЬЮ
    displaySubcategories(products);
}

// НОВАЯ ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ ПОДКАТЕГОРИЙ
function displaySubcategories(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    let html = '';
    
    // Добавляем карусель
    html += `
        <div class="games-carousel">
            <div class="carousel-container" id="carousel-container"></div>
            <div class="carousel-dots" id="carousel-dots"></div>
        </div>
    `;
    
    // Добавляем подкатегории если они есть
    if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
        const subcategories = productCategories['playstation_personal'].subcategories;
        const subcategoryIds = Object.keys(subcategories).filter(id => id !== 'carousel');
        
        if (subcategoryIds.length > 0) {
            html += '<div style="margin: 30px 16px 20px;">';
            html += '<div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 16px;">Подкатегории</div>';
            html += '<div class="categories-grid">';
            
            subcategoryIds.forEach(categoryId => {
                const category = subcategories[categoryId];
                html += `
                    <div class="category-card" onclick="showSubcategoryProducts('${categoryId}')">
                        <div class="category-icon">${category.type === 'carousel' ? '🔄' : '📱'}</div>
                        <div class="category-name">${category.name}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 5px;">
                            ${category.products.length} товаров
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
    }
    
    // Добавляем основные товары
    if (products.length > 0) {
        html += `
            <div style="margin: 0 16px;">
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 30px 0 16px;">Все товары</div>
                <div class="products-grid" id="main-products-grid">
                    ${products.map(product => `
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
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="text-align: center; color: rgba(255,255,255,0.6); padding: 60px 20px;">
                🎮<br><br>
                Товары скоро появятся
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ФУНКЦИИ ДЛЯ РАБОТЫ С ПОДКАТЕГОРИЯМИ
function showSubcategoryProducts(subcategoryId) {
    const subcategory = productCategories['playstation_personal'].subcategories[subcategoryId];
    if (!subcategory) return;
    
    const container = document.getElementById('products-container');
    
    if (subcategory.products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.6); padding: 60px 20px;">
                🎮<br><br>
                В подкатегории "${subcategory.name}" пока нет товаров
            </div>
            <div style="text-align: center; margin: 20px;">
                <button onclick="showProducts('playstation_personal')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 10px 20px; color: white; cursor: pointer;">
                    ← Назад ко всем товарам
                </button>
            </div>
        `;
        return;
    }
    
    if (subcategory.type === 'carousel') {
        // Для карусельных подкатегорий
        container.innerHTML = `
            <div style="margin: 0 16px 30px;">
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 16px;">${subcategory.name}</div>
                <div class="games-carousel">
                    <div class="carousel-container" id="subcategory-carousel">
                        ${subcategory.products.map(product => `
                            <div class="carousel-slide">
                                <div class="carousel-game" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || product.image}')">
                                    <img src="${product.imageUrl || product.image}" alt="${product.name}" class="carousel-game-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQzIiBoZWlnaHQ9IjM0NSIgdmlld0JveD0iMCAwIDM0MyAzNDUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNDMiIGhlaWdodD0iMzQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE3MS41IiB5PSIxNzIuNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGxheVN0YXRpb24gR2FtZTwvdGV4dD4KPC9zdmc+'">
                                    <div class="carousel-game-overlay">
                                        <div class="carousel-game-title">${product.name}</div>
                                        <div class="carousel-game-prices">
                                            <div class="carousel-game-price">${product.price} руб.</div>
                                            ${product.originalPrice ? `<div class="carousel-game-old-price">${product.originalPrice} руб.</div>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="carousel-dots" id="subcategory-dots"></div>
                </div>
            </div>
            <div style="text-align: center; margin: 20px;">
                <button onclick="showProducts('playstation_personal')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 10px 20px; color: white; cursor: pointer;">
                    ← Назад ко всем товарам
                </button>
            </div>
        `;
        
        // Инициализируем карусель подкатегории
        setTimeout(() => initSubcategoryCarousel(), 100);
    } else {
        // Для обычных подкатегорий (сетка)
        container.innerHTML = `
            <div style="margin: 0 16px;">
                <div style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 20px;">${subcategory.name}</div>
                <div class="products-grid">
                    ${subcategory.products.map(product => `
                        <div class="product-card">
                            ${product.isNew ? `<div class="product-badge">NEW</div>` : ''}
                            ${product.discount ? `<div class="product-badge discount">-${product.discount}%</div>` : ''}
                            
                            <button class="favorite-button ${favorites.some(fav => fav.id === product.id) ? 'active' : ''}" 
                                    onclick="toggleFavorite(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl || product.image}')">
                                ${favorites.some(fav => fav.id === product.id) ? '❤️' : '🤍'}
                            </button>
                            
                            <div class="product-image">
                                <img src="${product.imageUrl || product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
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
                    `).join('')}
                </div>
            </div>
            <div style="text-align: center; margin: 30px;">
                <button onclick="showProducts('playstation_personal')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 12px 24px; color: white; cursor: pointer;">
                    ← Назад ко всем товарам
                </button>
            </div>
        `;
    }
}

function initSubcategoryCarousel() {
    const container = document.getElementById('subcategory-carousel');
    const dots = document.getElementById('subcategory-dots');
    
    if (!container) return;
    
    // Очищаем точки
    dots.innerHTML = '';
    
    // Добавляем точки навигации
    const slides = container.querySelectorAll('.carousel-slide');
    slides.forEach((slide, index) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSubcategorySlide(index);
        dots.appendChild(dot);
    });
    
    // Настраиваем drag & drop
    setupSubcategoryCarouselDrag();
}

function goToSubcategorySlide(slideIndex) {
    const container = document.getElementById('subcategory-carousel');
    const dots = document.querySelectorAll('#subcategory-dots .carousel-dot');
    
    if (container) {
        container.scrollTo({
            left: slideIndex * container.clientWidth,
            behavior: 'smooth'
        });
    }
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
}

function setupSubcategoryCarouselDrag() {
    const container = document.getElementById('subcategory-carousel');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDown) finishSubcategoryDrag();
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX);
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchend', () => {
        if (isDown) finishSubcategoryDrag();
    });

    function finishSubcategoryDrag() {
        if (!isDown) return;
        isDown = false;
        container.style.scrollBehavior = 'smooth';
        
        const slideWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;
        const targetSlide = Math.round(currentScroll / slideWidth);
        const targetScroll = targetSlide * slideWidth;
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        // Обновляем активную точку
        const dots = document.querySelectorAll('#subcategory-dots .carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === targetSlide);
        });
    }
}

function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const allProducts = getAllProducts();
    
    if (!query.trim()) {
        if (currentCategory && productsData[currentCategory]) {
            showProducts('playstation_personal');
        }
        return;
    }
    
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    if (currentSection === 'products') {
        displayProducts(filteredProducts);
    }
}

function getAllProducts() {
    let allProducts = [];
    
    // Добавляем товары из основной базы
    for (const category in productsData) {
        allProducts = allProducts.concat(productsData[category]);
    }
    
    // Добавляем товары из подкатегорий
    if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
        Object.keys(productCategories['playstation_personal'].subcategories).forEach(categoryId => {
            allProducts = allProducts.concat(productCategories['playstation_personal'].subcategories[categoryId].products);
        });
    }
    
    return allProducts;
}

function searchByCategory(category) {
    document.getElementById('search-input').value = category;
    searchProducts();
}

// ==================== КОРЗИНА ====================
function showCart() {
    navigateToPage('cart', 'Корзина');
    setActiveTab('cart');
    updateCartDisplay();
}

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

// ==================== ИЗБРАННОЕ ====================
function showFavorites() {
    navigateToPage('favorites', 'Избранное');
    setActiveTab('favorites');
    updateFavoritesDisplay();
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
        showProducts('playstation_personal');
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

// ==================== КОРЗИНА ФУНКЦИИ ====================
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

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ВНЕШНИЕ ССЫЛКИ ====================
function openNewsChannel() {
    tg.openLink('https://t.me/GoshaStoreBot');
}

function openSupport() {
    tg.openTelegramLink('https://t.me/GoshaPlayStation');
}

// ==================== КАРУСЕЛЬ ====================
function initCarousel() {
    const container = document.getElementById('carousel-container');
    if (!container) {
        console.log('Карусель не найдена на этой странице');
        return;
    }
    
    // Очищаем предыдущую карусель
    container.innerHTML = '';
    
    // Собираем все товары для карусели
    let allProducts = [...productsData['playstation_personal']];
    
    // Добавляем товары из подкатегорий
    if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
        Object.keys(productCategories['playstation_personal'].subcategories).forEach(categoryId => {
            allProducts = allProducts.concat(productCategories['playstation_personal'].subcategories[categoryId].products);
        });
    }
    
    // Берем товары со скидками или новинки
    featuredGames = allProducts
        .filter(product => product.discount || product.isNew)
        .slice(0, 5);
    
    // Если нет товаров со скидками, берем первые 3
    if (featuredGames.length === 0) {
        featuredGames = allProducts.slice(0, 3);
    }
    
    // Если все равно нет товаров, создаем тестовые
    if (featuredGames.length === 0) {
        featuredGames = [
            {
                id: 1,
                name: "God of War Ragnarok",
                price: 3999,
                originalPrice: 4999,
                imageUrl: "https://via.placeholder.com/343x345/333/white?text=God+of+War",
                discount: 20,
                isNew: true
            },
            {
                id: 2,
                name: "Spider-Man 2",
                price: 4999,
                originalPrice: 0,
                imageUrl: "https://via.placeholder.com/343x345/333/white?text=Spider-Man+2",
                discount: 0,
                isNew: true
            },
            {
                id: 3,
                name: "The Last of Us Part II",
                price: 3499,
                originalPrice: 4499,
                imageUrl: "https://via.placeholder.com/343x345/333/white?text=Last+of+Us",
                discount: 22,
                isNew: false
            }
        ];
    }
    
    renderCarousel();
    
    // Добавляем обработчик скролла для обновления активного слайда
    container.addEventListener('scroll', updateActiveSlide);
    
    // Инициализируем активный слайд
    setTimeout(updateActiveSlide, 100);
    
    startAutoScroll();
    setupCarouselDrag();
}

function updateActiveSlide() {
    const container = document.getElementById('carousel-container');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!container || slides.length === 0) return;
    
    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth;
    const rawSlide = scrollLeft / slideWidth;
    currentSlide = Math.min(Math.max(0, Math.round(rawSlide)), slides.length - 1);
    
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function renderCarousel() {
    const container = document.getElementById('carousel-container');
    const dots = document.getElementById('carousel-dots');
    
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    dots.innerHTML = '';
    
    // Если нет товаров для карусели
    if (featuredGames.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">
                Карусель скоро появится
            </div>
        `;
        return;
    }
    
    // Создаем слайды
    featuredGames.forEach((game, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        slide.innerHTML = `
            <div class="carousel-game" onclick="addToCart(${game.id}, '${game.name.replace(/'/g, "\\'")}', ${game.price}, '${game.imageUrl || game.image}')">
                <img src="${game.imageUrl || game.image}" alt="${game.name}" class="carousel-game-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQzIiBoZWlnaHQ9IjM0NSIgdmlld0JveD0iMCAwIDM0MyAzNDUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNDMiIGhlaWdodD0iMzQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE3MS41IiB5PSIxNzIuNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGxheVN0YXRpb24gR2FtZTwvdGV4dD4KPC9zdmc+'">
                <div class="carousel-game-overlay">
                    <div class="carousel-game-title">${game.name}</div>
                    <div class="carousel-game-prices">
                        <div class="carousel-game-price">${game.price} руб.</div>
                        ${game.originalPrice ? `<div class="carousel-game-old-price">${game.originalPrice} руб.</div>` : ''}
                        ${game.discount ? `<div class="carousel-game-discount">-${game.discount}%</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(slide);
        
        // Создаем точки навигации
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dots.appendChild(dot);
    });
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    const container = document.getElementById('carousel-container');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (container) {
        container.scrollTo({
            left: slideIndex * container.clientWidth,
            behavior: 'smooth'
        });
    }
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    restartAutoScroll();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % featuredGames.length;
    goToSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + featuredGames.length) % featuredGames.length;
    goToSlide(currentSlide);
}

function startAutoScroll() {
    autoScrollInterval = setInterval(nextSlide, 5000);
}

function restartAutoScroll() {
    clearInterval(autoScrollInterval);
    startAutoScroll();
}

function setupCarouselDrag() {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
        stopAutoScroll();
        container.classList.add('no-snap');
        document.querySelectorAll('.carousel-slide').forEach(slide => {
            slide.classList.add('no-snap');
        });
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isDown) {
            finishDrag();
        }
    });

    container.addEventListener('mouseup', () => {
        if (isDown) {
            finishDrag();
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
        stopAutoScroll();
        container.classList.add('no-snap');
        document.querySelectorAll('.carousel-slide').forEach(slide => {
            slide.classList.add('no-snap');
        });
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX);
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchend', () => {
        if (isDown) {
            finishDrag();
        }
    });

    container.addEventListener('mouseleave', () => {
        if (isDown) {
            finishDrag();
        }
    });

    function finishDrag() {
        if (!isDown) return;
        isDown = false;
        container.classList.remove('no-snap');
        document.querySelectorAll('.carousel-slide').forEach(slide => {
            slide.classList.remove('no-snap');
        });
        container.style.scrollBehavior = 'smooth';
        smoothSnapToSlide();
        startAutoScroll();
    }

    function smoothSnapToSlide() {
        const slideWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;
        const targetSlide = Math.round(currentScroll / slideWidth);
        const targetScroll = targetSlide * slideWidth;
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        setTimeout(updateActiveSlide, 300);
    }
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// ==================== ДОБАВЛЕНИЕ ТОВАРОВ В БАЗУ ====================
function initProductsData() {
    console.log('🔄 Инициализация товаров...');
    
    // Товары для основной базы (будут в карусели и в разделе "Все товары")
    productsData['playstation_personal'] = [
        {
            id: 1,
            name: "God of War Ragnarok",
            price: 3999,
            originalPrice: 4999,
            imageUrl: "https://via.placeholder.com/300x400/333/white?text=God+of+War",
            discount: 20,
            isNew: true,
            category: "Экшн",
            isImage: true
        },
        {
            id: 2,
            name: "Spider-Man 2",
            price: 4999,
            originalPrice: 0,
            imageUrl: "https://via.placeholder.com/300x400/333/white?text=Spider-Man+2",
            discount: 0,
            isNew: true,
            category: "Экшн",
            isImage: true
        },
        {
            id: 3,
            name: "Horizon Forbidden West",
            price: 4599,
            originalPrice: 0,
            imageUrl: "https://via.placeholder.com/300x400/333/white?text=Horizon+FW",
            discount: 0,
            isNew: true,
            category: "Приключения",
            isImage: true
        },
        {
            id: 4,
            name: "The Last of Us Part I",
            price: 3799,
            originalPrice: 4499,
            imageUrl: "https://via.placeholder.com/300x400/333/white?text=Last+of+Us+I",
            discount: 15,
            isNew: false,
            category: "Экшн",
            isImage: true
        },
        {
            id: 5,
            name: "Gran Turismo 7",
            price: 4299,
            originalPrice: 4999,
            imageUrl: "https://via.placeholder.com/300x400/333/white?text=Gran+Turismo+7",
            discount: 14,
            isNew: false,
            category: "Гонки",
            isImage: true
        }
    ];
    
    console.log('✅ Добавлено товаров в основную базу:', productsData['playstation_personal'].length);
}

function initSubcategoriesData() {
    console.log('🔄 Создание подкатегорий...');
    
    // Создаем подкатегорию "Распродажа"
    productCategories['playstation_personal'].subcategories['sale'] = {
        name: "Распродажа",
        type: "grid",
        products: [
            {
                id: 101,
                name: "Ratchet & Clank: Rift Apart",
                price: 3499,
                originalPrice: 4999,
                imageUrl: "https://via.placeholder.com/300x400/333/white?text=Ratchet+Clank",
                discount: 30,
                isNew: false,
                category: "Экшн",
                isImage: true
            },
            {
                id: 102,
                name: "Demon's Souls",
                price: 3799,
                originalPrice: 5499,
                imageUrl: "https://via.placeholder.com/300x400/333/white?text=Demons+Souls",
                discount: 31,
                isNew: false,
                category: "RPG",
                isImage: true
            },
            {
                id: 103,
                name: "Returnal",
                price: 3299,
                originalPrice: 4799,
                imageUrl: "https://via.placeholder.com/300x400/333/white?text=Returnal",
                discount: 31,
                isNew: false,
                category: "Экшн",
                isImage: true
            },
            {
                id: 104,
                name: "Death Stranding: Director's Cut",
                price: 2999,
                originalPrice: 3999,
                imageUrl: "https://via.placeholder.com/300x400/333/white?text=Death+Stranding",
                discount: 25,
                isNew: false,
                category: "Приключения",
                isImage: true
            },
            {
                id: 105,
                name: "Ghost of Tsushima: Director's Cut",
                price: 3599,
                originalPrice: 4999,
                imageUrl: "https://via.placeholder.com/300x400/333/white?text=Ghost+of+Tsushima",
                discount: 28,
                isNew: false,
                category: "Приключения",
                isImage: true
            }
        ]
    };
    
    console.log('✅ Создана подкатегория "Распродажа" с товарами:', 
                productCategories['playstation_personal'].subcategories['sale'].products.length);
    
    // Сохраняем изменения
    saveCategories();
}

// Функция для полной инициализации всех данных
function initializeAllData() {
    console.log('🎮 Начало инициализации данных...');
    
    initProductsData();      // Добавляем товары в основную базу
    initSubcategoriesData(); // Создаем подкатегории
    
    console.log('🎉 Все данные успешно загружены!');
    console.log('📊 Статистика:');
    console.log('   - Товаров в основной базе:', productsData['playstation_personal'].length);
    console.log('   - Подкатегорий:', Object.keys(productCategories['playstation_personal'].subcategories).length);
    
    // Обновляем отображение если мы на странице товаров
    if (currentSection === 'products') {
        showProducts('playstation_personal');
    }
    
    // Показываем уведомление
    showNotification('Товары загружены!', 'success');
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupBackButton();
    initUser();
    initCategories();
    showMain();
    
    // Загружаем тестовые данные через 1 секунду после загрузки
    setTimeout(initializeAllData, 1000);
    
    document.getElementById('nav-panel').classList.remove('active');
});
