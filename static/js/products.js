// PlayStation Store - Products Management

class ProductManager {
    constructor() {
        this.products = {};
        this.categories = [];
        this.searchCache = new Map();
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.extractCategories();
        this.setupSearchHandlers();
    }

    // Загрузка продуктов
    async loadProducts() {
        try {
            const response = await fetch('/products_data.json');
            if (response.ok) {
                this.products = await response.json();
            } else {
                this.products = this.getDefaultProducts();
            }
        } catch (error) {
            console.error('Ошибка загрузки продуктов:', error);
            this.products = this.getDefaultProducts();
        }
    }

    // Продукты по умолчанию
    getDefaultProducts() {
        return {
            "playstation_personal": [
                {
                    "id": 1,
                    "name": "God of War Ragnarök",
                    "price": 3999,
                    "oldPrice": 4999,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
                    "category": "Экшн",
                    "description": "Кратос и Атрей отправляются в путешествие по девяти мирам в поисках ответов, пока асгардские силы готовятся к пророческой битве, которая положит конец миру.",
                    "rating": 4.9,
                    "tags": ["экшн", "приключения", "мифология", "отец и сын"]
                },
                {
                    "id": 2,
                    "name": "Marvel's Spider-Man 2",
                    "price": 4999,
                    "oldPrice": 5999,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
                    "category": "Экшн",
                    "description": "Питер Паркер и Майлс Моралес возвращаются в новом приключении серии Marvel's Spider-Man.",
                    "rating": 4.8,
                    "tags": ["супергерои", "открытый мир", "экшн", "marvel"]
                },
                {
                    "id": 3,
                    "name": "Horizon Forbidden West",
                    "price": 2999,
                    "oldPrice": 3999,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/HO8vkO9pfXhwbHi5WHECQJdN.png",
                    "category": "RPG",
                    "description": "Присоединяйтесь к Элой в путешествии по постапокалиптическому миру, полному механических существ и древних тайн.",
                    "rating": 4.7,
                    "tags": ["rpg", "открытый мир", "постапокалипсис", "роботы"]
                },
                {
                    "id": 4,
                    "name": "The Last of Us Part I",
                    "price": 3499,
                    "oldPrice": 4499,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2BLa3dtkGJVE9Id.png",
                    "category": "Экшн",
                    "description": "Переживите эмоциональное путешествие Джоэла и Элли в полностью переработанной версии для PS5.",
                    "rating": 4.9,
                    "tags": ["выживание", "зомби", "драма", "ремастер"]
                },
                {
                    "id": 5,
                    "name": "Gran Turismo 7",
                    "price": 2799,
                    "oldPrice": 3799,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202110/2618/phvVT0qZfcRms5qDAk0SI3CM.png",
                    "category": "Гонки",
                    "description": "Откройте для себя мир автомобилей в самом реалистичном симуляторе вождения.",
                    "rating": 4.5,
                    "tags": ["гонки", "симулятор", "автомобили", "спорт"]
                },
                {
                    "id": 6,
                    "name": "Ratchet & Clank: Rift Apart",
                    "price": 2499,
                    "oldPrice": 3499,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202101/2921/DwVs8ZvALGFgbq1uIgDvmANc.png",
                    "category": "Платформер",
                    "description": "Путешествуйте между измерениями с Рэтчетом и Кланком в этом визуально потрясающем приключении.",
                    "rating": 4.6,
                    "tags": ["платформер", "sci-fi", "юмор", "семейная"]
                }
            ],
            "ps_plus": [
                {
                    "id": 101,
                    "name": "PS Plus Essential - 1 месяц",
                    "price": 599,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+Essential",
                    "category": "Подписка",
                    "description": "Доступ к онлайн-играм, ежемесячным играм и эксклюзивным скидкам.",
                    "features": ["Онлайн мультиплеер", "2-3 игры каждый месяц", "Эксклюзивные скидки", "Облачное хранилище 100 ГБ"]
                },
                {
                    "id": 102,
                    "name": "PS Plus Extra - 1 месяц",
                    "price": 999,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+Extra",
                    "category": "Подписка",
                    "description": "Каталог из сотен игр PS4 и PS5 + все преимущества Essential.",
                    "features": ["Все из Essential", "Каталог 400+ игр", "Игры PS4 и PS5", "Новые игры каждый месяц"]
                },
                {
                    "id": 103,
                    "name": "PS Plus Premium - 1 месяц",
                    "price": 1299,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+Premium",
                    "category": "Подписка",
                    "description": "Максимальный уровень подписки с классическими играми и облачным геймингом.",
                    "features": ["Все из Extra", "Классические игры PS1, PS2, PSP", "Облачный стриминг", "Пробные версии игр"]
                },
                {
                    "id": 104,
                    "name": "PS Plus Essential - 3 месяца",
                    "price": 1699,
                    "oldPrice": 1797,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+3M",
                    "category": "Подписка",
                    "description": "Подписка PS Plus Essential на 3 месяца со скидкой.",
                    "features": ["Онлайн мультиплеер", "6-9 игр за 3 месяца", "Эксклюзивные скидки", "Облачное хранилище"]
                },
                {
                    "id": 105,
                    "name": "PS Plus Essential - 12 месяцев",
                    "price": 5999,
                    "oldPrice": 7188,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+12M",
                    "category": "Подписка",
                    "description": "Годовая подписка PS Plus Essential с максимальной выгодой.",
                    "features": ["Онлайн мультиплеер", "24-36 игр в год", "Эксклюзивные скидки", "Облачное хранилище"]
                }
            ],
            "wallet_refill": [
                {
                    "id": 201,
                    "name": "Пополнение кошелька 500 ₽",
                    "price": 500,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=500+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 500 рублей.",
                    "region": "RU",
                    "validity": "Без ограничений"
                },
                {
                    "id": 202,
                    "name": "Пополнение кошелька 1000 ₽",
                    "price": 1000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=1000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 1000 рублей.",
                    "region": "RU",
                    "validity": "Без ограничений"
                },
                {
                    "id": 203,
                    "name": "Пополнение кошелька 2000 ₽",
                    "price": 2000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=2000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 2000 рублей.",
                    "region": "RU",
                    "validity": "Без ограничений"
                },
                {
                    "id": 204,
                    "name": "Пополнение кошелька 3000 ₽",
                    "price": 3000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=3000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 3000 рублей.",
                    "region": "RU",
                    "validity": "Без ограничений"
                },
                {
                    "id": 205,
                    "name": "Пополнение кошелька 5000 ₽",
                    "price": 5000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=5000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 5000 рублей.",
                    "region": "RU",
                    "validity": "Без ограничений"
                }
            ]
        };
    }

    // Извлечение категорий
    extractCategories() {
        this.categories = [
            { 
                id: 'playstation_personal', 
                name: 'PlayStation Личный', 
                icon: '🎮',
                description: 'Игры для личного аккаунта',
                color: 'var(--ps-gradient)'
            },
            { 
                id: 'ps_plus', 
                name: 'PS Plus', 
                icon: '⭐',
                description: 'Подписки PlayStation Plus',
                color: 'var(--ps-plus-gradient)'
            },
            { 
                id: 'wallet_refill', 
                name: 'Пополнение кошелька', 
                icon: '💳',
                description: 'Коды пополнения',
                color: 'var(--ps-wallet-gradient)'
            }
        ];
    }

    // Получение продуктов по категории
    getProductsByCategory(categoryId) {
        return this.products[categoryId] || [];
    }

    // Получение продукта по ID
    getProductById(productId, categoryId = null) {
        if (categoryId) {
            const products = this.getProductsByCategory(categoryId);
            return products.find(product => product.id === productId);
        }
        
        // Поиск по всем категориям
        for (const category in this.products) {
            const product = this.products[category].find(p => p.id === productId);
            if (product) return product;
        }
        
        return null;
    }

    // Поиск продуктов
    searchProducts(query, categoryId = null) {
        const cacheKey = `${query}_${categoryId || 'all'}`;
        
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }
        
        let searchResults = [];
        const searchQuery = query.toLowerCase().trim();
        
        if (!searchQuery) {
            if (categoryId) {
                searchResults = this.getProductsByCategory(categoryId);
            } else {
                // Возвращаем все продукты
                for (const category in this.products) {
                    searchResults = searchResults.concat(this.products[category]);
                }
            }
        } else {
            const categoriesToSearch = categoryId ? [categoryId] : Object.keys(this.products);
            
            categoriesToSearch.forEach(category => {
                const products = this.products[category] || [];
                const filtered = products.filter(product => {
                    return (
                        product.name.toLowerCase().includes(searchQuery) ||
                        product.category.toLowerCase().includes(searchQuery) ||
                        product.description.toLowerCase().includes(searchQuery) ||
                        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
                    );
                });
                searchResults = searchResults.concat(filtered);
            });
        }
        
        // Сортировка результатов по релевантности
        searchResults.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a, searchQuery);
            const bScore = this.calculateRelevanceScore(b, searchQuery);
            return bScore - aScore;
        });
        
        // Кэшируем результат
        this.searchCache.set(cacheKey, searchResults);
        
        return searchResults;
    }

    // Расчет релевантности для поиска
    calculateRelevanceScore(product, query) {
        if (!query) return 0;
        
        let score = 0;
        const lowerQuery = query.toLowerCase();
        
        // Точное совпадение в названии
        if (product.name.toLowerCase() === lowerQuery) score += 100;
        
        // Начинается с запроса
        if (product.name.toLowerCase().startsWith(lowerQuery)) score += 50;
        
        // Содержит запрос в названии
        if (product.name.toLowerCase().includes(lowerQuery)) score += 25;
        
        // Содержит в категории
        if (product.category.toLowerCase().includes(lowerQuery)) score += 15;
        
        // Содержит в описании
        if (product.description.toLowerCase().includes(lowerQuery)) score += 10;
        
        // Содержит в тегах
        if (product.tags) {
            product.tags.forEach(tag => {
                if (tag.toLowerCase().includes(lowerQuery)) score += 20;
            });
        }
        
        return score;
    }

    // Настройка обработчиков поиска
    setupSearchHandlers() {
        const searchInputs = document.querySelectorAll('[id^="search-"]');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const query = e.target.value;
                    const categoryId = this.getCategoryFromInputId(input.id);
                    this.performSearch(query, categoryId);
                }, 300); // Debounce 300ms
            });
        });
    }

    // Получение категории из ID поля поиска
    getCategoryFromInputId(inputId) {
        const mapping = {
            'search-personal': 'playstation_personal',
            'search-plus': 'ps_plus',
            'search-wallet': 'wallet_refill'
        };
        return mapping[inputId];
    }

    // Выполнение поиска
    performSearch(query, categoryId) {
        const results = this.searchProducts(query, categoryId);
        const containerId = this.getContainerIdFromCategory(categoryId);
        const container = document.getElementById(containerId);
        
        if (container && window.app) {
            window.app.renderProducts(results, container);
        }
    }

    // Получение ID контейнера из категории
    getContainerIdFromCategory(categoryId) {
        const mapping = {
            'playstation_personal': 'products-personal',
            'ps_plus': 'products-plus',
            'wallet_refill': 'products-wallet'
        };
        return mapping[categoryId];
    }

    // Очистка кэша поиска
    clearSearchCache() {
        this.searchCache.clear();
    }
}

// Создаем глобальный экземпляр
window.ProductManager = ProductManager;