// ==================== КОНФИГУРАЦИЯ АДМИНА ====================
const ADMIN_USER_ID = 5546654452;

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

// ==================== АДМИН ПЕРЕМЕННЫЕ ====================
let selectedFiles = [];
let productTemplates = {};
let urlProducts = [];

// ==================== КАРУСЕЛЬ ====================
let featuredGames = [];
let currentSlide = 0;
let autoScrollInterval;

// ==================== СЕРВЕРНЫЕ НАСТРОЙКИ ====================
const PRODUCTS_DATA_URL = '/api/products';
const SAVE_PRODUCTS_URL = '/api/admin/save-products';

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
    initAdminPanel();
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

// ==================== АДМИН ПАНЕЛЬ ====================
function isAdmin() {
    const user = tg.initDataUnsafe?.user;
    return user && user.id === ADMIN_USER_ID;
}

function initAdminPanel() {
    const secretButton = document.querySelector('.secret-button-header');
    const adminPanel = document.getElementById('admin-panel');
    
    if (isAdmin()) {
        secretButton.style.display = 'flex';
        adminPanel.style.display = 'block';
    } else {
        secretButton.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

function toggleAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel.style.display === 'none') {
        adminPanel.style.display = 'block';
        updateProductsCount();
    } else {
        adminPanel.style.display = 'none';
    }
}

function switchAdminTab(tabName) {
    if (!isAdmin()) return;
    
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetSection = document.getElementById('admin-' + tabName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const targetTab = document.querySelector(`.admin-tab[onclick="switchAdminTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    if (tabName === 'categories') {
        loadCategoriesList();
    }
    
    // ОБНОВЛЯЕМ СПИСКИ КАТЕГОРИЙ ДЛЯ ВСЕХ ВКЛАДОК
    if (tabName === 'urls') {
        updateUrlCategorySelect();
    }
    if (tabName === 'files') {
        updateBatchCategorySelect();
    }
}

function updateProductsCount() {
    let total = 0;
    
    // Считаем товары в основной базе
    total += productsData['playstation_personal'].length;
    
    // Считаем товары во всех подкатегориях
    if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
        Object.keys(productCategories['playstation_personal'].subcategories).forEach(categoryId => {
            total += productCategories['playstation_personal'].subcategories[categoryId].products.length;
        });
    }
    
    const totalElement = document.getElementById('total-products');
    if (totalElement) {
        totalElement.textContent = total;
    }
}

// ==================== АДМИН: УПРАВЛЕНИЕ КАТЕГОРИЯМИ ====================
function createNewCategory() {
    if (!isAdmin()) return;
    
    const name = document.getElementById('new-category-name').value;
    const type = document.getElementById('category-type').value;
    
    if (!name.trim()) {
        showNotification('Введите название подкатегории', 'error');
        return;
    }
    
    if (!productCategories['playstation_personal']) {
        productCategories['playstation_personal'] = {
            name: 'PlayStation Личный',
            subcategories: {}
        };
    }
    
    if (!productCategories['playstation_personal'].subcategories) {
        productCategories['playstation_personal'].subcategories = {};
    }
    
    const categoryId = 'cat_' + Date.now();
    
    productCategories['playstation_personal'].subcategories[categoryId] = {
        name: name,
        type: type,
        products: []
    };
    
    saveCategories();
    loadCategoriesList();
    document.getElementById('new-category-name').value = '';
    
    showNotification(`Подкатегория "${name}" создана!`, 'success');
}

function loadCategoriesList() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    if (!productCategories['playstation_personal'] || !productCategories['playstation_personal'].subcategories) {
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Нет созданных подкатегорий</div>';
        return;
    }
    
    const subcategories = productCategories['playstation_personal'].subcategories;
    
    container.innerHTML = '';
    
    if (Object.keys(subcategories).length === 0) {
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Нет созданных подкатегорий</div>';
        return;
    }
    
    Object.keys(subcategories).forEach(categoryId => {
        const category = subcategories[categoryId];
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.style.cssText = `
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        categoryElement.innerHTML = `
            <div>
                <strong style="color: white;">${category.name}</strong>
                <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 5px;">
                    Тип: ${category.type === 'carousel' ? 'Карусель' : 'Сетка'} | 
                    Товаров: ${category.products.length}
                </div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">
                    ID: ${categoryId}
                </div>
            </div>
            <div>
                <button onclick="viewCategoryProducts('${categoryId}')" style="background: #667eea; border: none; border-radius: 6px; padding: 8px 12px; color: white; cursor: pointer; margin-left: 5px;">👁️</button>
                <button onclick="deleteCategory('${categoryId}')" style="background: #ff6b6b; border: none; border-radius: 6px; padding: 8px 12px; color: white; cursor: pointer; margin-left: 5px;">🗑️</button>
            </div>
        `;
        
        container.appendChild(categoryElement);
    });
    
    // ОБНОВЛЯЕМ список категорий для других вкладок
    updateUrlCategorySelect();
    updateBatchCategorySelect();
}

function deleteCategory(categoryId) {
    if (!isAdmin()) return;
    
    const categoryName = productCategories['playstation_personal'].subcategories[categoryId].name;
    
    if (confirm(`Удалить подкатегорию "${categoryName}"? Все товары в ней будут удалены!`)) {
        delete productCategories['playstation_personal'].subcategories[categoryId];
        saveCategories();
        loadCategoriesList();
        showNotification(`Подкатегория "${categoryName}" удалена`, 'warning');
    }
}

function viewCategoryProducts(categoryId) {
    const category = productCategories['playstation_personal'].subcategories[categoryId];
    if (!category) return;
    
    alert(`В категории "${category.name}" находится ${category.products.length} товаров:\n\n` +
          category.products.map(p => `• ${p.name} - ${p.price} руб.`).join('\n'));
}

// ==================== АДМИН: ФАЙЛЫ ====================
function handleFileSelect(files) {
    if (!isAdmin()) return;
    
    selectedFiles = Array.from(files);
    updateFileList();
    showQuickTemplate();
    generatePreviews();
}

function updateFileList() {
    const fileList = document.getElementById('file-list');
    const filesContainer = document.getElementById('files-container');
    const fileCount = document.getElementById('file-count');
    
    fileCount.textContent = selectedFiles.length;
    filesContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">🖼️</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <button onclick="removeFile(${index})" style="background: none; border: none; color: #ff6b6b; cursor: pointer;">✕</button>
        `;
        filesContainer.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    if (selectedFiles.length === 0) {
        document.getElementById('quick-template').style.display = 'none';
        document.getElementById('batch-preview').style.display = 'none';
    } else {
        showQuickTemplate();
        generatePreviews();
    }
}

function showQuickTemplate() {
    const template = document.getElementById('quick-template');
    const container = document.getElementById('template-container');
    
    container.innerHTML = '';
    
    // ОБНОВЛЯЕМ ВЫБОР КАТЕГОРИИ ДЛЯ ПАКЕТНОГО ДОБАВЛЕНИЯ
    updateBatchCategorySelect();
    
    selectedFiles.forEach((file, index) => {
        const nameFromFile = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        
        const templateRow = document.createElement('div');
        templateRow.className = 'template-row';
        templateRow.innerHTML = `
            <input type="text" class="template-input product-name" value="${nameFromFile}" 
                   placeholder="Название товара" onchange="updateTemplate(${index})">
            <input type="number" class="template-input product-price" value="1999" 
                   placeholder="Цена" onchange="updateTemplate(${index})">
            <input type="number" class="template-input product-old-price" value="0" 
                   placeholder="Старая цена" onchange="updateTemplate(${index})">
            <select class="template-input product-category" onchange="updateTemplate(${index})">
                <option value="Экшн">Экшн</option>
                <option value="Приключения">Приключения</option>
                <option value="RPG">RPG</option>
                <option value="Стратегии">Стратегии</option>
                <option value="Спорт">Спорт</option>
                <option value="Гонки">Гонки</option>
                <option value="Разное">Разное</option>
            </select>
            <div>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" class="product-new" onchange="updateTemplate(${index})"> Новинка
                </label>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" class="product-discount" onchange="updateTemplate(${index})"> Скидка
                </label>
            </div>
        `;
        container.appendChild(templateRow);
        updateTemplate(index);
    });
    
    template.style.display = 'block';
}

function updateTemplate(index) {
    const row = document.getElementById('template-container').children[index];
    
    productTemplates[index] = {
        name: row.querySelector('.product-name').value,
        price: parseInt(row.querySelector('.product-price').value) || 0,
        oldPrice: parseInt(row.querySelector('.product-old-price').value) || null,
        category: row.querySelector('.product-category').value,
        isNew: row.querySelector('.product-new').checked,
        hasDiscount: row.querySelector('.product-discount').checked
    };
    
    generatePreviews();
}

function applyTemplateToAll() {
    const firstRow = document.getElementById('template-container').children[0];
    const name = firstRow.querySelector('.product-name').value;
    const price = firstRow.querySelector('.product-price').value;
    const oldPrice = firstRow.querySelector('.product-old-price').value;
    const category = firstRow.querySelector('.product-category').value;
    const isNew = firstRow.querySelector('.product-new').checked;
    const hasDiscount = firstRow.querySelector('.product-discount').checked;
    
    const rows = document.getElementById('template-container').children;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (i > 0) {
            row.querySelector('.product-name').value = name + ' ' + (i + 1);
        }
        row.querySelector('.product-price').value = price;
        row.querySelector('.product-old-price').value = oldPrice;
        row.querySelector('.product-category').value = category;
        row.querySelector('.product-new').checked = isNew;
        row.querySelector('.product-discount').checked = hasDiscount;
        
        updateTemplate(i);
    }
}

function generatePreviews() {
    const preview = document.getElementById('batch-preview');
    preview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const template = productTemplates[index] || {};
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewItem.innerHTML = `
                <img src="${e.target.result}" class="preview-image" alt="${template.name}">
                <div class="preview-name" title="${template.name}">${template.name || 'Без названия'}</div>
                <div style="font-size: 10px; color: #667eea;">${template.price || 0} руб.</div>
                ${template.isNew ? '<div style="font-size: 8px; color: #ffd700;">NEW</div>' : ''}
            `;
        };
        reader.readAsDataURL(file);
        preview.appendChild(previewItem);
    });
    
    preview.style.display = 'grid';
}

async function addAllProducts() {
    if (!isAdmin()) return;
    
    const categorySelect = document.getElementById('batch-category-select');
    const targetCategoryId = categorySelect ? categorySelect.value : '';
    
    let addedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        try {
            const file = selectedFiles[i];
            const template = productTemplates[i];
            
            if (!template || !template.name || !template.price) {
                errorCount++;
                continue;
            }
            
            const imageUrl = await readFileAsDataURL(file);
            
            const newProduct = {
                id: Date.now() + i,
                name: template.name,
                price: template.price,
                originalPrice: template.hasDiscount && template.oldPrice ? template.oldPrice : null,
                imageUrl: imageUrl,
                image: imageUrl,
                discount: template.hasDiscount && template.oldPrice ? 
                    Math.round((1 - template.price / template.oldPrice) * 100) : null,
                isNew: template.isNew,
                category: template.category,
                isImage: true
            };
            
            // ЕСЛИ ВЫБРАНА ПОДКАТЕГОРИЯ - ДОБАВЛЯЕМ В НЕЁ
            if (targetCategoryId && productCategories['playstation_personal'] && 
                productCategories['playstation_personal'].subcategories &&
                productCategories['playstation_personal'].subcategories[targetCategoryId]) {
                
                productCategories['playstation_personal'].subcategories[targetCategoryId].products.push(newProduct);
                addedCount++;
            } else {
                // ИНАЧЕ ДОБАВЛЯЕМ В ОСНОВНУЮ БАЗУ
                productsData['playstation_personal'].push(newProduct);
                addedCount++;
            }
            
        } catch (error) {
            errorCount++;
            console.error('Ошибка добавления товара:', error);
        }
    }
    
    // СОХРАНЯЕМ ИЗМЕНЕНИЯ
    saveCategories();
    updateProductsCount();
    
    showNotification(`Добавлено: ${addedCount} товаров. Ошибок: ${errorCount}`, 'success');
    
    // Очищаем форму
    selectedFiles = [];
    productTemplates = {};
    document.getElementById('file-list').style.display = 'none';
    document.getElementById('quick-template').style.display = 'none';
    document.getElementById('batch-preview').style.display = 'none';
    document.getElementById('file-input').value = '';
    
    if (currentSection === 'products') {
        showProducts('playstation_personal');
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== АДМИН: URL ====================
function previewUrlProducts() {
    if (!isAdmin()) return;
    
    const text = document.getElementById('url-products').value;
    const preview = document.getElementById('url-preview');
    const list = document.getElementById('url-list');
    const status = document.getElementById('url-status');
    
    if (!text.trim()) {
        preview.innerHTML = '';
        list.innerHTML = '';
        status.textContent = 'Готов к обработке';
        return;
    }
    
    try {
        const lines = text.split('\n').filter(line => line.trim());
        urlProducts = [];
        
        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 3) {
                const product = {
                    id: Date.now() + index,
                    name: parts[0] || 'Без названия',
                    price: parseInt(parts[1]) || 0,
                    oldPrice: parts[2] && parts[2] !== '0' ? parseInt(parts[2]) : null,
                    imageUrl: parts[3] || '',
                    category: parts[4] || 'Разное',
                    subcategory: parts[5] || '', // НОВОЕ ПОЛЕ - подкатегория
                    hasDiscount: !!(parts[2] && parts[2] !== '0'),
                    isNew: false
                };
                
                urlProducts.push(product);
            }
        });
        
        status.textContent = `Найдено товаров: ${urlProducts.length}`;
        preview.innerHTML = '';
        
        urlProducts.forEach((product, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${product.imageUrl}" class="url-preview" 
                     onload="this.classList.add('valid')" 
                     onerror="this.classList.add('invalid')"
                     alt="${product.name}">
                <div class="preview-name">${product.name}</div>
                <div style="font-size: 10px; color: #667eea;">${product.price} руб.</div>
                ${product.subcategory ? `<div style="font-size: 9px; color: rgba(255,255,255,0.7);">Категория: ${product.subcategory}</div>` : ''}
            `;
            preview.appendChild(previewItem);
        });
        
        showUrlProductsList();
        
    } catch (error) {
        status.textContent = 'Ошибка в формате данных';
    }
}

function showUrlProductsList() {
    const list = document.getElementById('url-list');
    list.innerHTML = '';
    
    // Получаем список доступных подкатегорий
    const availableSubcategories = {};
    if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
        Object.keys(productCategories['playstation_personal'].subcategories).forEach(catId => {
            availableSubcategories[catId] = productCategories['playstation_personal'].subcategories[catId].name;
        });
    }
    
    urlProducts.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'url-item';
        
        let subcategoryOptions = '<option value="">-- Основная база --</option>';
        Object.keys(availableSubcategories).forEach(catId => {
            const isSelected = product.subcategory === catId || product.subcategory === availableSubcategories[catId];
            subcategoryOptions += `<option value="${catId}" ${isSelected ? 'selected' : ''}>${availableSubcategories[catId]}</option>`;
        });
        
        item.innerHTML = `
            <img src="${product.imageUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjM1IiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='">
            <input type="text" value="${product.name}" onchange="updateUrlProduct(${index}, 'name', this.value)" 
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <input type="number" value="${product.price}" onchange="updateUrlProduct(${index}, 'price', this.value)"
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <input type="number" value="${product.oldPrice || ''}" placeholder="0" onchange="updateUrlProduct(${index}, 'oldPrice', this.value)"
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <select onchange="updateUrlProduct(${index}, 'category', this.value)"
                    style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
                <option value="Экшн" ${product.category === 'Экшн' ? 'selected' : ''}>Экшн</option>
                <option value="Приключения" ${product.category === 'Приключения' ? 'selected' : ''}>Приключения</option>
                <option value="RPG" ${product.category === 'RPG' ? 'selected' : ''}>RPG</option>
                <option value="Стратегии" ${product.category === 'Стратегии' ? 'selected' : ''}>Стратегии</option>
                <option value="Спорт" ${product.category === 'Спорт' ? 'selected' : ''}>Спорт</option>
                <option value="Гонки" ${product.category === 'Гонки' ? 'selected' : ''}>Гонки</option>
                <option value="Разное" ${product.category === 'Разное' ? 'selected' : ''}>Разное</option>
            </select>
            <select onchange="updateUrlProduct(${index}, 'subcategory', this.value)"
                    style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
                ${subcategoryOptions}
            </select>
            <div>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" ${product.isNew ? 'checked' : ''} onchange="updateUrlProduct(${index}, 'isNew', this.checked)"> Новинка
                </label>
                <br>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" ${product.hasDiscount ? 'checked' : ''} onchange="updateUrlProduct(${index}, 'hasDiscount', this.checked)"> Скидка
                </label>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateUrlProduct(index, field, value) {
    if (urlProducts[index]) {
        urlProducts[index][field] = value;
        
        if (field === 'price' || field === 'oldPrice' || field === 'hasDiscount') {
            const product = urlProducts[index];
            if (product.hasDiscount && product.oldPrice) {
                product.discount = Math.round((1 - product.price / product.oldPrice) * 100);
            } else {
                product.discount = null;
            }
        }
    }
}

function addUrlProducts() {
    if (!isAdmin()) return;
    
    let addedCount = 0;
    let errorCount = 0;
    
    urlProducts.forEach(product => {
        try {
            if (!product.name || !product.price) {
                errorCount++;
                return;
            }
            
            const newProduct = {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.oldPrice || null,
                imageUrl: product.imageUrl,
                image: product.imageUrl,
                discount: product.discount || null,
                isNew: product.isNew || false,
                category: product.category || 'Разное',
                isImage: true
            };
            
            // ЕСЛИ УКАЗАНА ПОДКАТЕГОРИЯ - ДОБАВЛЯЕМ В НЕЁ
            if (product.subcategory && productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
                let targetSubcategoryId = null;
                
                // Ищем подкатегорию по ID или названию
                Object.keys(productCategories['playstation_personal'].subcategories).forEach(catId => {
                    if (catId === product.subcategory || productCategories['playstation_personal'].subcategories[catId].name === product.subcategory) {
                        targetSubcategoryId = catId;
                    }
                });
                
                if (targetSubcategoryId) {
                    productCategories['playstation_personal'].subcategories[targetSubcategoryId].products.push(newProduct);
                    addedCount++;
                } else {
                    // Если подкатегория не найдена, добавляем в основную базу
                    productsData['playstation_personal'].push(newProduct);
                    addedCount++;
                }
            } else {
                // Если подкатегория не указана, добавляем в основную базу
                productsData['playstation_personal'].push(newProduct);
                addedCount++;
            }
            
        } catch (error) {
            errorCount++;
            console.error('Ошибка добавления товара:', error);
        }
    });
    
    // Сохраняем изменения
    saveCategories();
    updateProductsCount();
    
    showNotification(`Добавлено: ${addedCount} товаров. Ошибок: ${errorCount}`, 'success');
    
    // Очищаем форму
    urlProducts = [];
    document.getElementById('url-products').value = '';
    document.getElementById('url-preview').innerHTML = '';
    document.getElementById('url-list').innerHTML = '';
    document.getElementById('url-status').textContent = 'Готов к обработке';
    
    // Обновляем отображение если мы в разделе товаров
    if (currentSection === 'products') {
        showProducts('playstation_personal');
    }
}

function updateUrlCategorySelect() {
    const select = document.getElementById('url-category-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Выберите подкатегорию --</option>';
    
    if (!productCategories['playstation_personal'] || !productCategories['playstation_personal'].subcategories) {
        select.innerHTML += '<option value="carousel">Горячие предложения (по умолчанию)</option>';
        return;
    }
    
    const subcategories = productCategories['playstation_personal'].subcategories;
    
    Object.keys(subcategories).forEach(categoryId => {
        const category = subcategories[categoryId];
        select.innerHTML += `<option value="${categoryId}">${category.name}</option>`;
    });
}

function updateBatchCategorySelect() {
    const select = document.getElementById('batch-category-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Основная база товаров --</option>';
    
    if (!productCategories['playstation_personal'] || !productCategories['playstation_personal'].subcategories) {
        return;
    }
    
    const subcategories = productCategories['playstation_personal'].subcategories;
    
    Object.keys(subcategories).forEach(categoryId => {
        const category = subcategories[categoryId];
        select.innerHTML += `<option value="${categoryId}">${category.name}</option>`;
    });
}

// ==================== АДМИН: УПРАВЛЕНИЕ ====================
function importProducts(input) {
    if (!isAdmin()) return;
    
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // ОБНОВЛЯЕМ ВСЕ ДАННЫЕ
                if (importedData.productsData) {
                    productsData = importedData.productsData;
                }
                
                if (importedData.productCategories) {
                    productCategories = importedData.productCategories;
                }
                
                updateProductsCount();
                loadCategoriesList();
                showNotification('Все данные загружены!', 'success');
                
                if (currentSection === 'products') {
                    showProducts('playstation_personal');
                }
            } catch (error) {
                showNotification('Ошибка загрузки файла', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function clearAllProducts() {
    if (!isAdmin()) return;
    
    if (confirm('Вы уверены что хотите удалить ВСЕ товары из всех категорий? Это действие нельзя отменить!')) {
        // Очищаем основную базу
        productsData['playstation_personal'] = [];
        
        // Очищаем все подкатегории
        if (productCategories['playstation_personal'] && productCategories['playstation_personal'].subcategories) {
            Object.keys(productCategories['playstation_personal'].subcategories).forEach(categoryId => {
                productCategories['playstation_personal'].subcategories[categoryId].products = [];
            });
        }
        
        updateProductsCount();
        saveCategories();
        showNotification('Все товары удалены из всех категорий', 'warning');
        
        if (currentSection === 'products') {
            showProducts('playstation_personal');
        }
    }
}

// ==================== СЕРВЕРНЫЕ ФУНКЦИИ ====================
async function saveProductsToServer() {
    if (!isAdmin()) return;
    
    try {
        console.log('💾 Сохранение товаров на сервер...');
        
        // СОБИРАЕМ ВСЕ ДАННЫЕ ДЛЯ СОХРАНЕНИЯ
        const dataToSave = {
            productsData: productsData,
            productCategories: productCategories,
            savedAt: new Date().toISOString()
        };
        
        const response = await fetch(SAVE_PRODUCTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification('Все данные сохранены на сервер!', 'success');
            console.log('✅ Все данные сохранены на сервер');
        } else {
            showNotification('Ошибка сохранения: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('Ошибка сети при сохранении', 'error');
    }
}

async function loadProductsFromServer() {
    try {
        console.log('🔄 Загрузка данных с сервера...');
        const response = await fetch(PRODUCTS_DATA_URL);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки с сервера');
        }
        
        const serverData = await response.json();
        
        // ОБНОВЛЯЕМ ВСЕ ДАННЫЕ
        if (serverData.productsData) {
            productsData = serverData.productsData;
        }
        
        if (serverData.productCategories) {
            productCategories = serverData.productCategories;
        }
        
        console.log('✅ Данные загружены с сервера');
        
        // Обновляем отображение
        if (currentSection === 'products') {
            showProducts('playstation_personal');
        }
        
        // Обновляем счетчик в админке
        updateProductsCount();
        
        // Обновляем список категорий
        loadCategoriesList();
        
    } catch (error) {
        console.log('⚠️ Не удалось загрузить с сервера:', error.message);
        // Если сервер не отвечает, загружаем из localStorage
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    console.log('🔄 Загрузка из localStorage...');
    
    // Загружаем productsData
    const savedProducts = localStorage.getItem('goshaStoreProducts');
    if (savedProducts) {
        productsData = JSON.parse(savedProducts);
    }
    
    // Загружаем productCategories
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
        productCategories = JSON.parse(savedCategories);
    }
    
    updateProductsCount();
    loadCategoriesList();
    
    if (currentSection === 'products') {
        showProducts('playstation_personal');
    }
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

// ==================== DRAG & DROP ====================
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelect(files);
    }
});

// ==================== ДЕБАГ ФУНКЦИИ ====================
function debugCategories() {
    console.log('=== ДЕБАГ КАТЕГОРИЙ ===');
    console.log('productCategories:', productCategories);
    console.log('productsData:', productsData);
    console.log('=== КОНЕЦ ДЕБАГА ===');
}

function debugCarousel() {
    console.log('=== ДЕБАГ КАРУСЕЛИ ===');
    console.log('Карусель контейнер:', document.getElementById('carousel-container'));
    console.log('featuredGames:', featuredGames);
    console.log('productsData:', productsData);
    console.log('=== КОНЕЦ ДЕБАГА ===');
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    setupBackButton();
    initUser();
    initCategories();
    showMain();
    updateProductsCount();
    
    document.getElementById('nav-panel').classList.remove('active');
});
