// ==================== ОСНОВНЫЕ КОНСТАНТЫ И ПЕРЕМЕННЫЕ ====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.hide();

// ==================== КОНФИГУРАЦИЯ АДМИНА ====================
const ADMIN_USER_ID = 5546654452;

// ==================== НАСТРОЙКИ СЕРВЕРА ====================
const PRODUCTS_DATA_URL = '/api/products';
const SAVE_PRODUCTS_URL = '/api/admin/save-products';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
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

// ==================== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ ====================
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
    console.log('🔄 Переход на страницу:', pageId);
    
    if (addToHistory && currentPage !== pageId) {
        pageHistory.push({
            page: currentPage,
            title: 'GoshaStore'
        });
    }
    
    hideAllPages();
    const targetPage = document.getElementById(pageId + '-page');
    
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('✅ Страница активирована:', pageId);
    } else {
        console.error('❌ Страница не найдена:', pageId);
        return;
    }
    
    // Управление навигационной панелью
    if (pageId === 'main') {
        showBackButton(false);
        hideNavPanel();
        document.getElementById('profile-button')?.classList.remove('active');
    } else {
        showBackButton(true);
        
        if (pageId === 'profile') {
            document.getElementById('profile-button')?.classList.add('active');
            hideNavPanel();
        } else if (pageId === 'products' || pageId === 'categories' || 
                  pageId === 'cart' || pageId === 'favorites') {
            showNavPanel();
            setActiveTabForPage(pageId);
        } else {
            hideNavPanel();
        }
    }
    
    currentPage = pageId;
}

function setActiveTabForPage(pageId) {
    const tabMap = {
        'products': 'home',
        'categories': 'categories', 
        'favorites': 'favorites',
        'cart': 'cart'
    };
    
    setActiveTab(tabMap[pageId] || 'home');
}

function goBack() {
    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop();
        navigateToPage(previousPage.page, previousPage.title, false);
    } else {
        tg.close();
    }
}

function activateInput(type) {
    if (activeInput) {
        deactivateInput(activeInput);
    }
    
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    if (card && input) {
        card.classList.add('active');
        input.focus();
        activeInput = type;
        
        if (input.value.trim()) {
            card.classList.add('has-value');
        }
    }
}

function deactivateInput(type) {
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    if (card && input) {
        if (!input.value.trim()) {
            card.classList.remove('active');
            card.classList.remove('has-value');
        }
        activeInput = null;
    }
}

function handleInputChange(type) {
    const card = document.getElementById(`${type}-card`);
    const input = document.getElementById(`user-${type}`);
    
    if (card && input) {
        if (input.value.trim()) {
            card.classList.add('has-value');
        } else {
            card.classList.remove('has-value');
        }
        
        autoSaveData();
    }
}

function initUser() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        const firstName = user.first_name || 'Пользователь';
        const welcomeElement = document.getElementById('profile-welcome');
        const profileButton = document.getElementById('profile-button');
        
        if (welcomeElement) welcomeElement.textContent = `Привет, ${firstName}!`;
        if (profileButton) profileButton.textContent = firstName;
        
        loadUserData();
    } else {
        const welcomeElement = document.getElementById('profile-welcome');
        const profileButton = document.getElementById('profile-button');
        
        if (welcomeElement) welcomeElement.textContent = 'Привет!';
        if (profileButton) profileButton.textContent = 'Профиль';
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

// ==================== ФУНКЦИИ НАВИГАЦИИ ====================
function showMain() {
    navigateToPage('main', 'GoshaStore');
}

function showProfile() {
    console.log('👤 Открываем профиль');
    navigateToPage('profile', 'Профиль');
}

function showHistory() {
    navigateToPage('history', 'История заказов');
}

function showNavPanel() {
    const navPanel = document.getElementById('nav-panel');
    if (navPanel) {
        navPanel.classList.add('active');
    }
}

function hideNavPanel() {
    const navPanel = document.getElementById('nav-panel');
    if (navPanel) {
        navPanel.classList.remove('active');
    }
}

function setActiveTab(tabName) {
    console.log('🎯 Активируем таб:', tabName);
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabMap = {
        'home': 0,
        'categories': 1, 
        'favorites': 2,
        'cart': 3
    };
    
    if (tabMap[tabName] !== undefined && tabs[tabMap[tabName]]) {
        tabs[tabMap[tabName]].classList.add('active');
    }
}

function showSectionHome() {
    if (currentSection === 'products') {
        showProducts('playstation_personal');
    } else {
        showMain();
    }
}

function showCategories() {
    console.log('📂 Открываем категории');
    navigateToPage('categories', 'Категории игр');
    loadCategories();
}

function showFavorites() {
    console.log('⭐ Открываем избранное');
    navigateToPage('favorites', 'Избранное');
    updateFavoritesDisplay();
}

function showCart() {
    console.log('🛒 Открываем корзину');
    navigateToPage('cart', 'Корзина');
    updateCartDisplay();
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
    if (container) {
        container.innerHTML = categories.map(category => `
            <div class="category-card" onclick="searchByCategory('${category.name}')">
                <div class="category-icon">${category.icon}</div>
                <div class="category-name">${category.name}</div>
            </div>
        `).join('');
    }
}

function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const allProducts = getAllProducts();
    
    if (!query.trim()) {
        if (currentCategory && productsData[currentCategory]) {
            displayProducts(productsData[currentCategory]);
        }
        return;
    }
    
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query))
    );
    
    if (currentSection === 'products') {
        displayProducts(filteredProducts);
    }
}

function getAllProducts() {
    let allProducts = [];
    for (const category in productsData) {
        if (productsData[category]) {
            allProducts = allProducts.concat(productsData[category]);
        }
    }
    return allProducts;
}

function searchByCategory(category) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = category;
        searchProducts();
    }
}

function openNewsChannel() {
    tg.openLink('https://t.me/GoshaStoreBot');
}

function openSupport() {
    tg.openTelegramLink('https://t.me/GoshaPlayStation');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
}

// ==================== СЕРВЕРНЫЕ ФУНКЦИИ ====================
async function loadProductsFromServer() {
    try {
        console.log('🔄 Загрузка товаров с сервера...');
        const response = await fetch(PRODUCTS_DATA_URL);
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки с сервера');
        }
        
        const serverData = await response.json();
        productsData = serverData;
        
        console.log('✅ Товары загружены с сервера');
        
        if (currentSection === 'products') {
            displayProducts(productsData[currentCategory]);
        }
        
        updateProductsCount();
        
    } catch (error) {
        console.log('⚠️ Не удалось загрузить с сервера:', error.message);
    }
}

async function saveProductsToServer() {
    if (!isAdmin()) return;
    
    try {
        console.log('💾 Сохранение товаров на сервер...');
        const response = await fetch(SAVE_PRODUCTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productsData)
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification('Товары сохранены на сервер!', 'success');
            console.log('✅ Товары сохранены на сервер');
        } else {
            showNotification('Ошибка сохранения: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('Ошибка сети при сохранении', 'error');
    }
}

// ==================== АДМИН ФУНКЦИИ ====================
function isAdmin() {
    const user = tg.initDataUnsafe?.user;
    return user && user.id === ADMIN_USER_ID;
}

function initAdminPanel() {
    const secretButton = document.querySelector('.secret-button-header');
    const adminPanel = document.getElementById('admin-panel');
    
    if (isAdmin()) {
        if (secretButton) secretButton.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'block';
        console.log('👑 Админ-панель активирована');
    } else {
        if (secretButton) secretButton.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
        console.log('👤 Обычный пользователь');
    }
}

function toggleAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        if (adminPanel.style.display === 'none' || adminPanel.style.display === '') {
            adminPanel.style.display = 'block';
            updateProductsCount();
        } else {
            adminPanel.style.display = 'none';
        }
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
    const targetTab = document.querySelector(`.admin-tab[onclick="switchAdminTab('${tabName}')"]`);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetTab) targetTab.classList.add('active');
}

function updateProductsCount() {
    const total = productsData['playstation_personal'] ? productsData['playstation_personal'].length : 0;
    const totalElement = document.getElementById('total-products');
    if (totalElement) {
        totalElement.textContent = total;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение запускается...');
    setupBackButton();
    initUser();
    showMain();
    updateProductsCount();
    
    // Инициализация карусели
    if (typeof initCarousel === 'function') {
        initCarousel();
    }
    
    // Скрываем навигацию при загрузке (на главной)
    hideNavPanel();
    
    // Загружаем товары с сервера при запуске
    loadProductsFromServer();
    
    console.log('✅ Приложение успешно запущено');
});

// ==================== КАРУСЕЛЬ ИГР ====================
let featuredGames = [];
let currentSlide = 0;
let autoScrollInterval;

function initCarousel() {
    featuredGames = [
        {
            id: 1,
            name: "God of War Ragnarok",
            price: 3999,
            oldPrice: 4999,
            image: "https://example.com/god-of-war.jpg",
            discount: 20
        },
        {
            id: 2,
            name: "Spider-Man 2",
            price: 4999,
            oldPrice: 0,
            image: "https://example.com/spider-man.jpg",
            discount: 0
        }
    ];
    
    renderCarousel();
    startAutoScroll();
}

function renderCarousel() {
    const container = document.getElementById('carousel-container');
    const dots = document.getElementById('carousel-dots');
    
    if (!container) return;
    
    container.innerHTML = '';
    if (dots) dots.innerHTML = '';
    
    featuredGames.forEach((game, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        slide.innerHTML = `
            <div class="carousel-game" onclick="openGameDetails(${game.id})">
                <div style="width:100%;height:345px;background:linear-gradient(135deg,#2d3748,#4a5568);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">
                    ${game.name}
                </div>
                <div class="carousel-game-overlay">
                    <div class="carousel-game-title">${game.name}</div>
                    <div class="carousel-game-prices">
                        <div class="carousel-game-price">${game.price} руб.</div>
                        ${game.oldPrice ? `<div class="carousel-game-old-price">${game.oldPrice} руб.</div>` : ''}
                        ${game.discount ? `<div class="carousel-game-discount">-${game.discount}%</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(slide);
        
        if (dots) {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(index);
            dots.appendChild(dot);
        }
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

function startAutoScroll() {
    autoScrollInterval = setInterval(nextSlide, 5000);
}

function restartAutoScroll() {
    clearInterval(autoScrollInterval);
    startAutoScroll();
}

function openGameDetails(gameId) {
    const game = featuredGames.find(g => g.id === gameId);
    if (game) {
        showNotification(`Открываем "${game.name}"`, 'info');
    }
}
