// ==================== ОСНОВНЫЕ КОНСТАНТЫ И ПЕРЕМЕННЫЕ ====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.hide();

// ==================== КОНФИГУРАЦИЯ АДМИНА ====================
// ЗАМЕНИТЕ НА ВАШ REAL TELEGRAM ID
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
    if (addToHistory && currentPage !== pageId) {
        pageHistory.push({
            page: currentPage,
            title: document.getElementById('header-title') ? document.getElementById('header-title').textContent : 'GoshaStore'
        });
    }
    
    hideAllPages();
    document.getElementById(pageId + '-page').classList.add('active');
    
    // УБИРАЕМ ИЗМЕНЕНИЕ ЗАГОЛОВКА - ТЕКСТА БОЛЬШЕ НЕТ
    // if (title) {
    //     document.getElementById('header-title').textContent = title;
    // }
    
    if (pageId === 'main') {
        showBackButton(false);
        hideNavPanel();
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
        // УБРАЛИ СТРОКУ С УВЕДОМЛЕНИЕМ
    }, 1000);
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
    } else if (tabName === 'cart') {
        tabs[2].classList.add('active');
    } else if (tabName === 'favorites') {
        tabs[3].classList.add('active');
    }
}

function showSectionHome() {
    if (currentSection === 'products') {
        navigateToPage('products', 'PlayStation Личный');
        setActiveTab('home');
    }
}

function showCategories() {
    navigateToPage('categories', 'Категории игр');
    setActiveTab('categories');
    loadCategories();
}

function showCart() {
    navigateToPage('cart', 'Корзина');
    setActiveTab('cart');
    updateCartDisplay();
}

function showFavorites() {
    navigateToPage('favorites', 'Избранное');
    setActiveTab('favorites');
    updateFavoritesDisplay();
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
        product.category.toLowerCase().includes(query)
    );
    
    if (currentSection === 'products') {
        displayProducts(filteredProducts);
    }
}

function getAllProducts() {
    let allProducts = [];
    for (const category in productsData) {
        allProducts = allProducts.concat(productsData[category]);
    }
    return allProducts;
}

function searchByCategory(category) {
    document.getElementById('search-input').value = category;
    searchProducts();
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
        setTimeout(() => notification.remove(), 300);
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
        
        // ЗАМЕНЯЕМ локальные данные на данные с сервера
        productsData = serverData;
        
        console.log('✅ Товары загружены с сервера');
        
        // Обновляем отображение
        if (currentSection === 'products') {
            displayProducts(productsData[currentCategory]);
        }
        
        // Обновляем счетчик в админке
        updateProductsCount();
        
        // УБРАЛИ СТРОКУ С УВЕДОМЛЕНИЕМ
        
    } catch (error) {
        console.log('⚠️ Не удалось загрузить с сервера:', error.message);
        // УБРАЛИ СТРОКУ С УВЕДОМЛЕНИЕМ
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
        secretButton.style.display = 'flex';
        adminPanel.style.display = 'block';
        console.log('👑 Админ-панель активирована');
    } else {
        secretButton.style.display = 'none';
        adminPanel.style.display = 'none';
        console.log('👤 Обычный пользователь');
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
    
    document.getElementById('admin-' + tabName).classList.add('active');
    document.querySelector(`.admin-tab[onclick="switchAdminTab('${tabName}')"]`).classList.add('active');
}

function updateProductsCount() {
    const total = productsData['playstation_personal'].length;
    document.getElementById('total-products').textContent = total;
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', function() {
    setupBackButton();
    initUser();
    showMain();
    updateProductsCount();
    
    // Загружаем товары с сервера при запуске
    loadProductsFromServer();
});
