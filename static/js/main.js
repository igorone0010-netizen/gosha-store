// ===== GLOBAL VARIABLES =====
const tg = window.Telegram.WebApp;
let currentPage = 'main';
let cart = [];
let favorites = [];
let userData = {};
let featuredGames = [];
let allGames = [];

// ===== TELEGRAM WEB APP INITIALIZATION =====
function initTelegramApp() {
    tg.expand();
    tg.MainButton.hide();
    tg.BackButton.hide();
    
    tg.onEvent('backButtonClicked', goBack);
    
    // Initialize user data from Telegram
    const user = tg.initDataUnsafe?.user;
    if (user) {
        const firstName = user.first_name || 'Пользователь';
        document.getElementById('profile-name').textContent = firstName;
        document.getElementById('user-greeting').textContent = `Привет, ${firstName}!`;
    }
}

// ===== PAGE MANAGEMENT =====
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update navigation active state
        const navMap = {
            'main': 0,
            'categories': 1,
            'favorites': 2,
            'cart': 3
        };
        
        if (navMap[pageId] !== undefined) {
            document.querySelectorAll('.nav-item')[navMap[pageId]].classList.add('active');
        }
    }
    
    // Handle page-specific initialization
    switch(pageId) {
        case 'products':
            initProductsPage();
            break;
        case 'categories':
            initCategoriesPage();
            break;
        case 'cart':
            initCartPage();
            break;
        case 'favorites':
            initFavoritesPage();
            break;
        case 'profile':
            loadProfileData();
            break;
    }
    
    // Update back button
    if (pageId === 'main') {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
    }
    
    currentPage = pageId;
}

function goBack() {
    if (currentPage === 'main') {
        tg.close();
    } else {
        showPage('main');
    }
}

// ===== DATA INITIALIZATION =====
function initAppData() {
    loadCart();
    loadFavorites();
    loadProfileData();
    initGamesData();
    updateBadges();
}

function initGamesData() {
    // Featured games for carousel
    featuredGames = [
        {
            id: 1,
            name: "God of War Ragnarök",
            price: 3999,
            originalPrice: 4999,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xWJL9ZTz0TpR5SB0wqYGd1N.png",
            discount: 20,
            category: "Экшн"
        },
        {
            id: 2,
            name: "Marvel's Spider-Man 2",
            price: 4999,
            originalPrice: 5999,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7f2c8d6d9c791e3e0d7d9c6c6a6a6a.png",
            discount: 17,
            category: "Экшн"
        },
        {
            id: 3,
            name: "The Last of Us Part I",
            price: 3499,
            originalPrice: 4499,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2BLa3dtgGJVe9wX.png",
            discount: 22,
            category: "Экшн"
        }
    ];

    // All games
    allGames = [
        {
            id: 4,
            name: "Horizon Forbidden West",
            price: 4599,
            originalPrice: 0,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/1dy5b4vm8eb3bXrDkRS9FWlG.png",
            discount: 0,
            category: "Приключения"
        },
        {
            id: 5,
            name: "Gran Turismo 7",
            price: 4299,
            originalPrice: 4999,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202109/2921/BWMVfyxONkI1u2kOGqThXpJM.png",
            discount: 14,
            category: "Гонки"
        },
        {
            id: 6,
            name: "Returnal",
            price: 3799,
            originalPrice: 0,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202101/0812/4WvluNcGNJC1UX6Xj4R0FRgA.png",
            discount: 0,
            category: "Экшн"
        },
        {
            id: 7,
            name: "Ratchet & Clank: Rift Apart",
            price: 4699,
            originalPrice: 0,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202104/0119/aSDP6U761CLUj9ulG4NHp0gQ.png",
            discount: 0,
            category: "Приключения"
        },
        {
            id: 8,
            name: "Demon's Souls",
            price: 4199,
            originalPrice: 4999,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202009/3022/1dMJhGMLpGW50SEU8aK2G6d3.png",
            discount: 16,
            category: "RPG"
        },
        {
            id: 9,
            name: "Final Fantasy XVI",
            price: 4899,
            originalPrice: 0,
            image: "https://image.api.playstation.com/vulcan/ap/rnd/202211/0711/kh4MUIuMmHlktOHar3lVl6rY.png",
            discount: 0,
            category: "RPG"
        }
    ];
}

// ===== PRODUCTS PAGE =====
function initProductsPage() {
    renderFeaturedCarousel();
    renderHotOffers();
    renderAllGames();
}

function renderFeaturedCarousel() {
    const container = document.getElementById('featured-carousel');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if (!container) return;
    
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    featuredGames.forEach((game, index) => {
        const slide = document.createElement('div');
        slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <div class="carousel-game" onclick="addToCart(${game.id})">
                <img src="${game.image}" alt="${game.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UGxheVN0YXRpb24gR2FtZTwvdGV4dD48L3N2Zz4='">
                <div class="carousel-overlay">
                    <h3 class="carousel-title">${game.name}</h3>
                    <div class="carousel-prices">
                        <span class="carousel-price">${game.price} руб.</span>
                        ${game.originalPrice ? `<span class="carousel-old-price">${game.originalPrice} руб.</span>` : ''}
                        ${game.discount ? `<span class="carousel-discount">-${game.discount}%</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(slide);
        
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    
    setupCarouselAutoScroll();
}

function setupCarouselAutoScroll() {
    let currentSlide = 0;
    
    setInterval(() => {
        currentSlide = (currentSlide + 1) % featuredGames.length;
        goToSlide(currentSlide);
    }, 5000);
}

function goToSlide(slideIndex) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === slideIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    const container = document.getElementById('featured-carousel');
    if (container) {
        container.scrollTo({
            left: slideIndex * container.offsetWidth,
            behavior: 'smooth'
        });
    }
}

function renderHotOffers() {
    const container = document.getElementById('offers-scroll');
    if (!container) return;
    
    const offers = allGames.filter(game => game.discount > 0).slice(0, 5);
    
    container.innerHTML = offers.map(game => `
        <div class="offer-card">
            <div class="offer-badge">-${game.discount}%</div>
            <div class="offer-image">
                <img src="${game.image}" alt="${game.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9IjYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5QbGF5U3RhdGlvbiBHYW1lPC90ZXh0Pjwvc3ZnPg=='>
            </div>
            <div class="offer-info">
                <h4>${game.name}</h4>
                <div class="offer-prices">
                    <span class="offer-price">${game.price} руб.</span>
                    ${game.originalPrice ? `<span class="offer-old-price">${game.originalPrice} руб.</span>` : ''}
                </div>
                <button class="offer-btn" onclick="addToCart(${game.id})">Купить</button>
            </div>
        </div>
    `).join('');
}

function renderAllGames() {
    const container = document.getElementById('games-grid');
    if (!container) return;
    
    container.innerHTML = allGames.map(game => `
        <div class="game-card">
            <button class="game-favorite ${isFavorite(game.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${game.id})">
                ${isFavorite(game.id) ? '❤️' : '🤍'}
            </button>
            
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE2MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI4MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlBsYXlTdGF0aW9uIEdhbWU8L3RleHQ+PC9zdmc+'>
            </div>
            
            <div class="game-info">
                <h4>${game.name}</h4>
                <div class="game-prices">
                    <span class="game-price">${game.price} руб.</span>
                    ${game.originalPrice ? `<span class="game-old-price">${game.originalPrice} руб.</span>` : ''}
                    ${game.discount ? `<span class="game-discount">-${game.discount}%</span>` : ''}
                </div>
                <button class="game-btn" onclick="addToCart(${game.id})">Купить</button>
            </div>
        </div>
    `).join('');
}

// ===== CATEGORIES PAGE =====
function initCategoriesPage() {
    const categories = [
        { name: 'Экшн', icon: '🔫', description: 'Боевики и шутеры' },
        { name: 'Приключения', icon: '🗺️', description: 'Исследования и квесты' },
        { name: 'RPG', icon: '⚔️', description: 'Ролевые игры' },
        { name: 'Стратегии', icon: '♟️', description: 'Тактика и планирование' },
        { name: 'Спорт', icon: '⚽', description: 'Спортивные симуляторы' },
        { name: 'Гонки', icon: '🏎️', description: 'Авто и мотоспорт' },
        { name: 'Хоррор', icon: '👻', description: 'Ужасы и выживание' },
        { name: 'Инди', icon: '🎨', description: 'Независимые проекты' }
    ];
    
    const container = document.getElementById('categories-list');
    container.innerHTML = categories.map(category => `
        <div class="category-item" onclick="filterByCategory('${category.name}')">
            <div class="category-item-icon">${category.icon}</div>
            <div class="category-item-info">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
            </div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    showPage('products');
    const filteredGames = allGames.filter(game => game.category === category);
    renderFilteredGames(filteredGames, category);
}

function renderFilteredGames(games, category) {
    const container = document.getElementById('games-grid');
    if (!container) return;
    
    container.innerHTML = games.map(game => `
        <div class="game-card">
            <button class="game-favorite ${isFavorite(game.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${game.id})">
                ${isFavorite(game.id) ? '❤️' : '🤍'}
            </button>
            
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}">
            </div>
            
            <div class="game-info">
                <h4>${game.name}</h4>
                <div class="game-prices">
                    <span class="game-price">${game.price} руб.</span>
                    ${game.originalPrice ? `<span class="game-old-price">${game.originalPrice} руб.</span>` : ''}
                    ${game.discount ? `<span class="game-discount">-${game.discount}%</span>` : ''}
                </div>
                <button class="game-btn" onclick="addToCart(${game.id})">Купить</button>
            </div>
        </div>
    `).join('');
}

// ===== CART FUNCTIONS =====
function initCartPage() {
    updateCartDisplay();
}

function addToCart(gameId) {
    const game = [...featuredGames, ...allGames].find(g => g.id === gameId);
    if (!game) return;
    
    const existingItem = cart.find(item => item.id === gameId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: game.id,
            name: game.name,
            price: game.price,
            image: game.image,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`"${game.name}" добавлен в корзину`, 'success');
    updateBadges();
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    showNotification(`"${item.name}" удален из корзины`, 'warning');
    updateBadges();
}

function updateCartDisplay() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('total-price');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Корзина пуста</h3>
                <p>Добавьте товары из каталога</p>
            </div>
        `;
        totalElement.textContent = '0 руб.';
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.textContent = `${total} руб.`;
    
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} руб. × ${item.quantity}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
        </div>
    `).join('');
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
    updateBadges();
}

// ===== FAVORITES FUNCTIONS =====
function initFavoritesPage() {
    updateFavoritesDisplay();
}

function toggleFavorite(gameId) {
    const game = [...featuredGames, ...allGames].find(g => g.id === gameId);
    if (!game) return;
    
    const index = favorites.findIndex(fav => fav.id === gameId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showNotification(`"${game.name}" удален из избранного`, 'warning');
    } else {
        favorites.push({
            id: game.id,
            name: game.name,
            price: game.price,
            image: game.image
        });
        showNotification(`"${game.name}" добавлен в избранное`, 'success');
    }
    
    saveFavorites();
    updateFavoritesDisplay();
    updateBadges();
    
    // Update UI if on products page
    if (currentPage === 'products') {
        renderAllGames();
    }
}

function isFavorite(gameId) {
    return favorites.some(fav => fav.id === gameId);
}

function updateFavoritesDisplay() {
    const container = document.getElementById('favorites-grid');
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⭐</div>
                <h3>Нет избранных товаров</h3>
                <p>Добавьте игры в избранное</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = favorites.map(game => `
        <div class="game-card">
            <button class="game-favorite active" onclick="toggleFavorite(${game.id})">
                ❤️
            </button>
            
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}">
            </div>
            
            <div class="game-info">
                <h4>${game.name}</h4>
                <div class="game-prices">
                    <span class="game-price">${game.price} руб.</span>
                </div>
                <button class="game-btn" onclick="addToCart(${game.id})">Купить</button>
            </div>
        </div>
    `).join('');
}

// ===== PROFILE FUNCTIONS =====
function loadProfileData() {
    const savedData = localStorage.getItem('goshaStoreUserData');
    if (savedData) {
        userData = JSON.parse(savedData);
        document.getElementById('user-email').value = userData.email || '';
        document.getElementById('user-password').value = userData.password || '';
        document.getElementById('user-2fa').value = userData.twoFA || '';
    }
}

function saveProfile() {
    userData = {
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value,
        twoFA: document.getElementById('user-2fa').value,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('goshaStoreUserData', JSON.stringify(userData));
    showNotification('Данные сохранены', 'success');
}

// ===== DATA PERSISTENCE =====
function loadCart() {
    const savedCart = localStorage.getItem('goshaStoreCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCart() {
    localStorage.setItem('goshaStoreCart', JSON.stringify(cart));
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

function updateBadges() {
    // Cart badge
    const cartBadge = document.getElementById('cart-badge');
    const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartTotal > 0) {
        cartBadge.textContent = cartTotal > 9 ? '9+' : cartTotal;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
    
    // Favorites badge
    const favoritesBadge = document.getElementById('favorites-badge');
    if (favorites.length > 0) {
        favoritesBadge.textContent = favorites.length > 9 ? '9+' : favorites.length;
        favoritesBadge.style.display = 'flex';
    } else {
        favoritesBadge.style.display = 'none';
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// ===== EXTERNAL LINKS =====
function openNewsChannel() {
    tg.openLink('https://t.me/GoshaStoreBot');
}

function openSupport() {
    tg.openTelegramLink('https://t.me/GoshaPlayStation');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    initAppData();
    showPage('main');
});
