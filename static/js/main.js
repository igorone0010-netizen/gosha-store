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
                <img src="${game.image}" alt="${game.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9IjYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5QbGF5U3RhdGlvbiBHYW1lPC90ZXh0Pjwvc3ZnPg==
