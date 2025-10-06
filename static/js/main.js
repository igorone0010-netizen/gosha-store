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
    
    // ЭТА СТРОКА ДОЛЖНА БЫТЬ - она вызывает отображение подкатегорий
    displaySubcategories(products);
}

// НОВАЯ ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ ПОДКАТЕГОРИЙ
function displaySubcategories(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    let html = '';
    
    // Добавляем основную карусель
    html += `
        <div class="games-carousel">
            <div class="carousel-container" id="carousel-container"></div>
            <div class="carousel-dots" id="carousel-dots"></div>
        </div>
    `;
    
    // Добавляем подкатегорию "Распродажа" как уменьшенную карусель
    if (productCategories['playstation_personal'] && 
        productCategories['playstation_personal'].subcategories && 
        productCategories['playstation_personal'].subcategories['sale']) {
        
        const saleCategory = productCategories['playstation_personal'].subcategories['sale'];
        
        html += `
            <div class="sale-carousel-section">
                <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 40px 0 20px; padding: 0 16px; text-align: left;">
                    ${saleCategory.name}
                </div>
                <div class="mini-carousel-container">
                    <div class="mini-carousel" id="mini-carousel">
        `;
        
        // Добавляем товары распродажи как слайды мини-карусели
        saleCategory.products.forEach((product, index) => {
            html += `
                <div class="mini-carousel-slide ${index === 0 ? 'active' : ''}">
                    <div class="mini-carousel-game" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl}')">
                        ${product.discount ? `<div class="product-badge discount">-${product.discount}%</div>` : ''}
                        
                        <button class="favorite-button ${favorites.some(fav => fav.id === product.id) ? 'active' : ''}" 
                                onclick="event.stopPropagation(); toggleFavorite(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.imageUrl}')">
                            ${favorites.some(fav => fav.id === product.id) ? '❤️' : '🤍'}
                        </button>
                        
                        <div class="mini-carousel-game-image">
                            <img src="${product.imageUrl}" alt="${product.name}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5QbGF5U3RhdGlvbiBHYW1lPC90ZXh0Pgo8L3N2Zz4K'">
                        </div>
                        
                        <div class="mini-carousel-game-overlay">
                            <div class="mini-carousel-game-title">${product.name}</div>
                            <div class="mini-carousel-game-prices">
                                <div class="mini-carousel-game-price">${product.price} руб.</div>
                                ${product.originalPrice ? `<div class="mini-carousel-game-old-price">${product.originalPrice} руб.</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                    <div class="mini-carousel-dots" id="mini-carousel-dots"></div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Инициализируем обе карусели
    setTimeout(() => {
        initCarousel();
        initMiniCarousel();
    }, 100);
}

function initHorizontalCarousels() {
    // Находим все контейнеры каруселей кроме основной
    const carouselContainers = document.querySelectorAll('.carousel-container');
    
    carouselContainers.forEach((container, index) => {
        // Пропускаем основную карусель (она уже настроена)
        if (container.id === 'carousel-container') return;
        
        // Настраиваем горизонтальную прокрутку
        container.style.display = 'flex';
        container.style.overflowX = 'auto';
        container.style.scrollSnapType = 'x mandatory';
        container.style.scrollBehavior = 'smooth';
        container.style.gap = '16px';
        container.style.padding = '10px 0';
        container.style.webkitOverflowScrolling = 'touch';
        
        // Скрываем scrollbar для красоты
        container.style.scrollbarWidth = 'none';
        container.style.msOverflowStyle = 'none';
        
        // Для Webkit браузеров
        if (container.style.webkitScrollbar) {
            container.style.webkitScrollbar = 'none';
        }
        
        // Добавляем обработчики для drag & drop
        setupHorizontalCarouselDrag(container);
    });
}

function setupHorizontalCarouselDrag(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.style.scrollBehavior = 'smooth';
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // Touch events для мобильных
    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
    });

    container.addEventListener('touchend', () => {
        isDown = false;
        container.style.scrollBehavior = 'smooth';
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX);
        container.scrollLeft = scrollLeft - walk;
    });
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

// ==================== МИНИ-КАРУСЕЛЬ РАСПРОДАЖИ ====================
function initMiniCarousel() {
    const container = document.getElementById('mini-carousel');
    if (!container) return;
    
    renderMiniCarouselDots();
    setupMiniCarouselDrag();
}

function renderMiniCarouselDots() {
    const dotsContainer = document.getElementById('mini-carousel-dots');
    if (!dotsContainer) return;
    
    const saleCategory = productCategories['playstation_personal']?.subcategories?.sale;
    if (!saleCategory) return;
    
    dotsContainer.innerHTML = '';
    
    saleCategory.products.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `mini-carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToMiniSlide(index);
        dotsContainer.appendChild(dot);
    });
}

function goToMiniSlide(slideIndex) {
    const container = document.getElementById('mini-carousel');
    const slides = document.querySelectorAll('.mini-carousel-slide');
    const dots = document.querySelectorAll('.mini-carousel-dot');
    
    if (!container || slides.length === 0) return;
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === slideIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    const slideWidth = container.clientWidth;
    container.scrollTo({
        left: slideIndex * slideWidth,
        behavior: 'smooth'
    });
}

function setupMiniCarouselDrag() {
    const container = document.getElementById('mini-carousel');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
        container.classList.add('no-snap');
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isDown) {
            finishMiniDrag();
        }
    });

    container.addEventListener('mouseup', () => {
        if (isDown) {
            finishMiniDrag();
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
        container.classList.add('no-snap');
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX);
        container.scrollLeft = scrollLeft - walk;
    });

    container.addEventListener('touchend', () => {
        if (isDown) {
            finishMiniDrag();
        }
    });

    container.addEventListener('mouseleave', () => {
        if (isDown) {
            finishMiniDrag();
        }
    });

    function finishMiniDrag() {
        if (!isDown) return;
        isDown = false;
        container.classList.remove('no-snap');
        container.style.scrollBehavior = 'smooth';
        smoothSnapToMiniSlide();
    }

    function smoothSnapToMiniSlide() {
        const slideWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;
        const targetSlide = Math.round(currentScroll / slideWidth);
        const targetScroll = targetSlide * slideWidth;
        
        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            const slides = document.querySelectorAll('.mini-carousel-slide');
            const dots = document.querySelectorAll('.mini-carousel-dot');
            
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === targetSlide);
            });
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === targetSlide);
            });
        }, 300);
    }
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
    createSaleSubcategory(); // Создаем подкатегорию "Распродажа"
    
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

// ==================== ПОДКАТЕГОРИЯ РАСПРОДАЖА ====================
function createSaleSubcategory() {
    console.log('🔄 Создание подкатегории "Распродажа"...');
    
    productCategories['playstation_personal'].subcategories['sale'] = {
        name: "🔥 Распродажа",
        type: "horizontal-carousel",
        products: [
            {
                id: 201,
                name: "God of War Ragnarök",
                price: 3499,
                originalPrice: 4999,
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202211/0711/kh4MUIuMmHlktOHar3lVl6rY.png",
                discount: 30,
                isNew: false,
                category: "Экшн",
                isImage: true
            },
            {
                id: 202,
                name: "Marvel's Spider-Man 2",
                price: 4299,
                originalPrice: 5999,
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7f2c8d6d9c791e3e0d7d9c6c6a6a6a.png",
                discount: 28,
                isNew: false,
                category: "Экшн",
                isImage: true
            },
            {
                id: 203,
                name: "The Last of Us Part I",
                price: 2999,
                originalPrice: 4499,
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2BLa3dtgGJVe9wX.png",
                discount: 33,
                isNew: false,
                category: "Экшн",
                isImage: true
            },
            {
                id: 204,
                name: "Horizon Forbidden West",
                price: 3199,
                originalPrice: 4999,
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/1dy5b4vm8eb3bXrDkRS9FWlG.png",
                discount: 36,
                isNew: false,
                category: "Приключения",
                isImage: true
            },
            {
                id: 205,
                name: "Gran Turismo 7",
                price: 2799,
                originalPrice: 3999,
                imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202109/2921/BWMVfyxONkI1u2kOGqThXpJM.png",
                discount: 30,
                isNew: false,
                category: "Гонки",
                isImage: true
            }
        ]
    };
    
    console.log('✅ Создана подкатегория "Распродажа" с товарами:', 
                productCategories['playstation_personal'].subcategories['sale'].products.length);
    
    saveCategories();
}

function initSaleCarousel() {
    const scrollContainer = document.getElementById('sale-carousel-scroll');
    if (!scrollContainer) return;
    
    setupHorizontalCarouselDrag(scrollContainer);
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
