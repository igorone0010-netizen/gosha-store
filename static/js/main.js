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

// ==================== КАРУСЕЛЬ ИГР ====================
let featuredGames = [];
let currentSlide = 0;
let autoScrollInterval;
let manualCarouselPosition = 0;

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
            title: 'GoshaStore'
        });
    }
    
    hideAllPages();
    document.getElementById(pageId + '-page').classList.add('active');
    
    if (pageId === 'main') {
        showBackButton(false);
        // СКРЫВАЕМ НАВИГАЦИЮ НА ГЛАВНОЙ
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

function showMain() {
    hideAllPages();
    document.getElementById('main-page').classList.add('active');
    
    // СКРЫВАЕМ НАВИГАЦИЮ НА ГЛАВНОЙ
    document.getElementById('nav-panel').classList.remove('active');
    
    // СКРЫВАЕМ АДМИН ПАНЕЛЬ
    document.getElementById('admin-panel').style.display = 'none';
    
    // Скрываем кнопку назад
    showBackButton(false);
    
    // Обновляем историю
    currentPage = 'main';
    pageHistory.length = 0; // Очищаем историю на главной
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
    // ИСПРАВЛЕНО: возвращаем в раздел товаров, а не на главную
    if (currentSection === 'products') {
        navigateToPage('products', 'PlayStation Личный');
        setActiveTab('home');
    } else {
        // Если не в разделе товаров, показываем главную
        showMain();
    }
}

// ==================== ФУНКЦИИ ДЛЯ НАВИГАЦИОННОЙ ПАНЕЛИ ====================
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

// ==================== КАРУСЕЛЬ ИГР ====================
function initCarousel() {
    const container = document.getElementById('carousel-container');
    if (!container) {
        console.log('Карусель не найдена на этой странице');
        return;
    }
    
    // Очищаем предыдущую карусель
    container.innerHTML = '';
    
    // Пример данных для карусели
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
        },
        {
            id: 3,
            name: "The Last of Us Part II",
            price: 3499,
            oldPrice: 4499,
            image: "https://example.com/last-of-us.jpg",
            discount: 22
        }
    ];
    
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
    const slideWidth = container.clientWidth; /* Теперь полная ширина */
    
    // Более точное определение текущего слайда
    const rawSlide = scrollLeft / slideWidth;
    currentSlide = Math.min(Math.max(0, Math.round(rawSlide)), slides.length - 1);
    
    // Плавное обновление классов
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
    
    // Создаем слайды
    featuredGames.forEach((game, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        slide.innerHTML = `
            <div class="carousel-game" onclick="openGameDetails(${game.id})">
                <img src="${game.image}" alt="${game.name}" class="carousel-game-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQzIiBoZWlnaHQ9IjM0NSIgdmlld0JveD0iMCAwIDM0MyAzNDUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNDMiIGhlaWdodD0iMzQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE3MS41IiB5PSIxNzIuNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGxheVN0YXRpb24gR2FtZTwvdGV4dD4KPC9zdmc+'">
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
    
    // Обновляем активную точку
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    // Перезапускаем автоскролл
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
    autoScrollInterval = setInterval(nextSlide, 5000); // Смена каждые 5 секунд
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

    // Мышь
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
        stopAutoScroll();
        
        // ⬇️ ОТКЛЮЧАЕМ SNAP во время перетаскивания
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

    // Касание (телефон)
    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollBehavior = 'auto';
        stopAutoScroll();
        
        // ⬇️ ОТКЛЮЧАЕМ SNAP во время перетаскивания
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
        
        // ⬇️ ВКЛЮЧАЕМ SNAP обратно
        container.classList.remove('no-snap');
        document.querySelectorAll('.carousel-slide').forEach(slide => {
            slide.classList.remove('no-snap');
        });
        
        container.style.scrollBehavior = 'smooth';
        smoothSnapToSlide();
        startAutoScroll();
    }

    function smoothSnapToSlide() {
        const slideWidth = container.clientWidth * 0.96 + 8;
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

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const container = document.getElementById('carousel-container');
        if (!container) return;
        
        const slideWidth = container.clientWidth * 0.92 + 10;
        
        if (e.key === 'ArrowLeft') {
            container.scrollBy({ left: -slideWidth, behavior: 'smooth' });
            setTimeout(updateActiveSlide, 300);
        } else if (e.key === 'ArrowRight') {
            container.scrollBy({ left: slideWidth, behavior: 'smooth' });
            setTimeout(updateActiveSlide, 300);
        }
    });
}

function openGameDetails(gameId) {
    // Функция для открытия деталей игры
    const game = featuredGames.find(g => g.id === gameId);
    if (game) {
        showNotification(`Открываем "${game.name}"`, 'info');
        // Здесь можно добавить переход на страницу товара
    }
}

// ==================== РУЧНАЯ КАРУСЕЛЬ ====================
function loadManualCarousel() {
    const container = document.getElementById('manual-carousel-container');
    if (!container) {
        console.log('Ручная карусель не найдена на этой странице');
        return;
    }

    // Очищаем предыдущую карусель
    container.innerHTML = '';

    // Используем те же данные, что и для основной карусели
    if (productsData && productsData.playstation_personal) {
        productsData.playstation_personal.forEach((game, index) => {
            const item = document.createElement('div');
            item.className = 'manual-carousel-item';
            item.onclick = () => openGameDetails(game.id);

            const discount = game.oldPrice ? Math.round(((game.oldPrice - game.price) / game.oldPrice) * 100) : 0;

            item.innerHTML = `
                <img src="${game.image}" alt="${game.name}" class="manual-game-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDI4MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTYwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlBsYXlTdGF0aW9uIEdhbWU8L3RleHQ+Cjwvc3ZnPg=='">
                <div class="manual-game-info">
                    <div class="manual-game-title">${game.name}</div>
                    <div class="manual-game-price">
                        <span class="manual-price-current">${game.price} руб.</span>
                        ${game.oldPrice ? `<span class="manual-price-old">${game.oldPrice} руб.</span>` : ''}
                        ${discount > 0 ? `<span class="manual-discount">-${discount}%</span>` : ''}
                    </div>
                    <div class="manual-game-category">${game.category}</div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    // Настраиваем кнопки управления
    setupManualCarouselControls();
}

function setupManualCarouselControls() {
    const container = document.getElementById('manual-carousel-container');
    const prevBtn = document.getElementById('manual-prev');
    const nextBtn = document.getElementById('manual-next');

    if (!container || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
        const scrollAmount = 300; // Ширина одного элемента + gap
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        const scrollAmount = 300; // Ширина одного элемента + gap
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Обновляем состояние кнопок при прокрутке
    container.addEventListener('scroll', () => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        prevBtn.style.opacity = container.scrollLeft <= 0 ? '0.5' : '1';
        nextBtn.style.opacity = container.scrollLeft >= maxScroll ? '0.5' : '1';
    });

    // Инициализируем состояние кнопок
    setTimeout(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        prevBtn.style.opacity = '0.5';
        nextBtn.style.opacity = maxScroll > 0 ? '1' : '0.5';
    }, 100);
}

// ==================== КАРУСЕЛЬ ТОВАРОВ ====================
function loadProductsCarousel() {
    const container = document.getElementById('products-carousel-container');
    if (!container) {
        console.log('Карусель товаров не найдена на этой странице');
        return;
    }

    // Очищаем предыдущую карусель
    container.innerHTML = '';

    // Используем все товары из всех категорий
    if (productsData) {
        const allProducts = [];
        
        // Собираем товары из всех категорий
        Object.keys(productsData).forEach(category => {
            if (Array.isArray(productsData[category])) {
                productsData[category].forEach(product => {
                    allProducts.push({...product, category});
                });
            }
        });

        // Создаем карточки товаров
        allProducts.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'products-carousel-item';
            item.onclick = () => openGameDetails(product.id);

            const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
            const isFavorite = favorites.includes(product.id);

            item.innerHTML = `
                <button class="products-favorite-btn ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${product.id})">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
                <img src="${product.image}" alt="${product.name}" class="products-game-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjYwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+R2FtZTwvdGV4dD4KPHN2Zz4='">
                <div class="products-game-info">
                    <div class="products-game-title">${product.name}</div>
                    <div class="products-game-price">
                        <span class="products-price-current">${product.price} ₽</span>
                        ${product.oldPrice ? `<span class="products-price-old">${product.oldPrice} ₽</span>` : ''}
                        ${discount > 0 ? `<span class="products-discount">-${discount}%</span>` : ''}
                    </div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    // Настраиваем кнопки управления
    setupProductsCarouselControls();
}

function setupProductsCarouselControls() {
    const container = document.getElementById('products-carousel-container');
    const prevBtn = document.getElementById('products-prev');
    const nextBtn = document.getElementById('products-next');

    if (!container || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
        const scrollAmount = 130; // Ширина одного элемента + gap
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        const scrollAmount = 130; // Ширина одного элемента + gap
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Обновляем состояние кнопок при прокрутке
    container.addEventListener('scroll', () => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        prevBtn.style.opacity = container.scrollLeft <= 0 ? '0.5' : '1';
        nextBtn.style.opacity = container.scrollLeft >= maxScroll ? '0.5' : '1';
    });

    // Инициализируем состояние кнопок
    setTimeout(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        prevBtn.style.opacity = '0.5';
        nextBtn.style.opacity = maxScroll > 0 ? '1' : '0.5';
    }, 100);
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
        
        // Загружаем карусели
        loadCarousel();
        loadManualCarousel();
        loadProductsCarousel();
        
        // Обновляем счетчик в админке
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
    

    
    // Скрываем навигацию при загрузке (на главной)
    document.getElementById('nav-panel').classList.remove('active');
    
    // Загружаем товары с сервера при запуске
    loadProductsFromServer();
    
    setTimeout(function() {
        const carousel = document.querySelector('.games-carousel');
        if (carousel) {
            carousel.style.width = '100%';
            carousel.style.overflow = 'hidden';
            console.log('✅ Исправлена ширина карусели');
        }
        
        const container = document.querySelector('.carousel-container');
        if (container) {
            container.style.width = '100%';
            container.style.margin = '0';
            container.style.padding = '20px 0';
            console.log('✅ Исправлен контейнер карусели');
        }
        
        const slides = document.querySelectorAll('.carousel-slide');
        slides.forEach(slide => {
            slide.style.flex = '0 0 100%';
            slide.style.margin = '0';
        });
    }, 1000);

    
});

// Функции для управления автопрокруткой
function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

function startAutoScroll() {
    // Останавливаем предыдущую автопрокрутку если есть
    stopAutoScroll();
    // Запускаем новую автопрокрутку
    autoScrollInterval = setInterval(nextSlide, 5000);
}
