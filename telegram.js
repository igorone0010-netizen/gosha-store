// PlayStation Store - Main Application Logic

class PSStoreApp {
    constructor() {
        this.currentSection = 'main-menu';
        this.navigationHistory = [];
        this.products = {};
        this.categories = [];
        this.init();
    }

    async init() {
        // Ждем инициализации Telegram API
        await this.waitForTelegram();
        
        // Инициализация компонентов
        this.initializeComponents();
        
        // Загрузка данных
        await this.loadData();
        
        // Настройка интерфейса
        this.setupUI();
        
        // Настройка обработчиков событий
        this.setupEventHandlers();
        
        console.log('PlayStation Store приложение инициализировано');
    }

    async waitForTelegram() {
        return new Promise((resolve) => {
            if (window.telegramAPI) {
                resolve();
            } else {
                const checkTelegram = setInterval(() => {
                    if (window.telegramAPI) {
                        clearInterval(checkTelegram);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    initializeComponents() {
        // Инициализация корзины
        if (window.Cart) {
            this.cart = new Cart();
        }
        
        // Инициализация продуктов
        if (window.ProductManager) {
            this.productManager = new ProductManager();
        }
        
        // Инициализация поддержки
        if (window.SupportManager) {
            this.supportManager = new SupportManager();
        }
    }

    async loadData() {
        try {
            // Загружаем данные о продуктах
            const response = await fetch('/products_data.json');
            if (response.ok) {
                this.products = await response.json();
            } else {
                // Fallback данные
                this.products = this.getFallbackProducts();
            }
            
            // Извлекаем категории
            this.extractCategories();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.products = this.getFallbackProducts();
            this.extractCategories();
        }
    }

    getFallbackProducts() {
        return {
            "playstation_personal": [
                {
                    "id": 1,
                    "name": "God of War Ragnarök",
                    "price": 3999,
                    "oldPrice": 4999,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
                    "category": "Экшн",
                    "description": "Кратос и Атрей отправляются в путешествие по девяти мирам в поисках ответов."
                },
                {
                    "id": 2,
                    "name": "Marvel's Spider-Man 2",
                    "price": 4999,
                    "oldPrice": 5999,
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
                    "category": "Экшн",
                    "description": "Питер Паркер и Майлс Моралес возвращаются в новом приключении."
                }
            ],
            "ps_plus": [
                {
                    "id": 101,
                    "name": "PS Plus Essential - 1 месяц",
                    "price": 599,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus",
                    "category": "Подписка",
                    "description": "Доступ к онлайн-играм и ежемесячным играм."
                },
                {
                    "id": 102,
                    "name": "PS Plus Extra - 1 месяц",
                    "price": 999,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/ffcc00/000000?text=PS+Plus+Extra",
                    "category": "Подписка",
                    "description": "Каталог из сотен игр PS4 и PS5."
                }
            ],
            "wallet_refill": [
                {
                    "id": 201,
                    "name": "Пополнение кошелька 1000 ₽",
                    "price": 1000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=1000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 1000 рублей."
                },
                {
                    "id": 202,
                    "name": "Пополнение кошелька 2000 ₽",
                    "price": 2000,
                    "oldPrice": 0,
                    "image": "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=2000+RUB",
                    "category": "Пополнение",
                    "description": "Код пополнения кошелька PlayStation Store на 2000 рублей."
                }
            ]
        };
    }

    extractCategories() {
        this.categories = [
            { id: 'playstation_personal', name: 'PlayStation Личный', icon: '🎮' },
            { id: 'ps_plus', name: 'PS Plus', icon: '⭐' },
            { id: 'wallet_refill', name: 'Пополнение кошелька', icon: '💳' }
        ];
    }

    setupUI() {
        // Обновляем имя пользователя
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && window.telegramAPI) {
            userNameElement.textContent = window.telegramAPI.getUserName();
        }
        
        // Показываем главное меню
        this.showMainMenu();
    }

    setupEventHandlers() {
        // Обработчики Telegram событий
        document.addEventListener('showMainMenu', () => {
            this.showMainMenu();
        });

        document.addEventListener('mainButtonClicked', () => {
            this.handleMainButtonClick();
        });

        // Обработчики навигации
        this.setupNavigationHandlers();
        
        // Обработчики поиска
        this.setupSearchHandlers();
    }

    setupNavigationHandlers() {
        // Обработчики нижней навигации
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                window.telegramAPI?.selectionFeedback();
                
                // Убираем активный класс со всех элементов
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Добавляем активный класс к текущему элементу
                item.classList.add('active');
            });
        });
    }

    setupSearchHandlers() {
        // Поиск в разделе PlayStation Personal
        const searchPersonal = document.getElementById('search-personal');
        if (searchPersonal) {
            searchPersonal.addEventListener('input', (e) => {
                this.searchProducts('playstation-personal', e.target.value);
            });
        }
    }

    // Навигация между разделами
    showSection(sectionId) {
        window.telegramAPI?.impactFeedback('light');
        
        // Скрываем все секции
        document.querySelectorAll('.main-content, .content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Добавляем в историю навигации
            this.navigationHistory.push(sectionId);
            
            // Показываем кнопку "Назад" если не главное меню
            if (sectionId !== 'main-menu') {
                window.telegramAPI?.showBackButton();
            } else {
                window.telegramAPI?.hideBackButton();
            }
            
            // Загружаем продукты для секции
            this.loadSectionProducts(sectionId);
        }
    }

    showMainMenu() {
        this.showSection('main-menu');
        this.navigationHistory = ['main-menu'];
        window.telegramAPI?.hideBackButton();
        window.telegramAPI?.hideMainButton();
    }

    goBack() {
        if (this.navigationHistory.length > 1) {
            this.navigationHistory.pop(); // Убираем текущую страницу
            const previousSection = this.navigationHistory[this.navigationHistory.length - 1];
            this.showSection(previousSection);
        } else {
            this.showMainMenu();
        }
    }

    // Загрузка продуктов для секции
    loadSectionProducts(sectionId) {
        let productsKey = '';
        let containerId = '';
        
        switch (sectionId) {
            case 'playstation-personal':
                productsKey = 'playstation_personal';
                containerId = 'products-personal';
                break;
            case 'ps-plus':
                productsKey = 'ps_plus';
                containerId = 'products-plus';
                break;
            case 'wallet-refill':
                productsKey = 'wallet_refill';
                containerId = 'products-wallet';
                break;
            default:
                return;
        }
        
        const products = this.products[productsKey] || [];
        const container = document.getElementById(containerId);
        
        if (container) {
            this.renderProducts(products, container);
        }
    }

    renderProducts(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎮</div>
                    <p>Товары скоро появятся</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="app.showProductModal(${product.id}, '${this.getProductsKeyByContainer(container.id)}')">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/2d2d2d/ffffff?text=No+Image'">
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">
                        <span class="current-price">${this.formatPrice(product.price)}</span>
                        ${product.oldPrice > 0 ? `
                            <span class="old-price">${this.formatPrice(product.oldPrice)}</span>
                            <span class="discount">-${Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
                        ` : ''}
                    </div>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); app.addToCart(${product.id}, '${this.getProductsKeyByContainer(container.id)}')">
                        Добавить в корзину
                    </button>
                </div>
            </div>
        `).join('');
    }

    getProductsKeyByContainer(containerId) {
        const mapping = {
            'products-personal': 'playstation_personal',
            'products-plus': 'ps_plus',
            'products-wallet': 'wallet_refill'
        };
        return mapping[containerId] || 'playstation_personal';
    }

    // Поиск продуктов
    searchProducts(sectionId, query) {
        const productsKey = this.getProductsKeyByContainer(sectionId.replace('-', '-') + 's');
        const products = this.products[productsKey] || [];
        
        if (!query.trim()) {
            const container = document.getElementById(sectionId.replace('-', '-') + 's');
            this.renderProducts(products, container);
            return;
        }
        
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
        
        const container = document.getElementById(sectionId.replace('-', '-') + 's');
        this.renderProducts(filteredProducts, container);
    }

    // Модальное окно продукта
    showProductModal(productId, productsKey) {
        const products = this.products[productsKey] || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        window.telegramAPI?.impactFeedback('medium');
        
        const modal = document.getElementById('product-modal');
        const modalContent = document.getElementById('modal-product-info');
        
        modalContent.innerHTML = `
            <img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 400px; border-radius: 12px; margin-bottom: 16px;"
                 onerror="this.src='https://via.placeholder.com/400x300/2d2d2d/ffffff?text=No+Image'">
            <h2 style="margin-bottom: 8px;">${product.name}</h2>
            <div style="color: var(--ps-light-blue); margin-bottom: 16px; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
                ${product.category}
            </div>
            <p style="margin-bottom: 20px; line-height: 1.6; opacity: 0.9;">
                ${product.description}
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: bold; color: var(--ps-green);">
                    ${this.formatPrice(product.price)}
                </span>
                ${product.oldPrice > 0 ? `
                    <span style="font-size: 18px; color: rgba(255,255,255,0.5); text-decoration: line-through;">
                        ${this.formatPrice(product.oldPrice)}
                    </span>
                    <span style="background: var(--ps-red); color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                        -${Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                ` : ''}
            </div>
            <button onclick="app.addToCart(${product.id}, '${productsKey}'); app.closeModal();" 
                    style="width: 100%; background: var(--ps-blue); border: none; color: white; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                Добавить в корзину
            </button>
        `;
        
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.remove('active');
    }

    // Работа с корзиной
    addToCart(productId, productsKey) {
        const products = this.products[productsKey] || [];
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        if (this.cart) {
            this.cart.addItem(product);
            window.telegramAPI?.notificationFeedback('success');
            this.showNotification('Товар добавлен в корзину', 'success');
        }
    }

    showCart() {
        this.showSection('cart');
        if (this.cart) {
            this.cart.render();
        }
    }

    showOrderHistory() {
        this.showSection('order-history');
        this.loadOrderHistory();
    }

    showSupport() {
        this.showSection('support');
    }

    // История заказов
    loadOrderHistory() {
        const container = document.getElementById('history-items');
        const orders = this.getOrderHistory();
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>У вас пока нет заказов</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="history-item">
                <div class="history-header">
                    <span class="order-id">Заказ #${order.id}</span>
                    <span class="order-date">${this.formatDate(order.timestamp)}</span>
                </div>
                <div class="order-status status-${order.status}">
                    ${this.getStatusText(order.status)}
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>${this.formatPrice(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    Итого: ${this.formatPrice(order.total)}
                </div>
            </div>
        `).join('');
    }

    getOrderHistory() {
        const orders = localStorage.getItem('ps_store_orders');
        return orders ? JSON.parse(orders) : [];
    }

    saveOrder(order) {
        const orders = this.getOrderHistory();
        orders.unshift(order);
        localStorage.setItem('ps_store_orders', JSON.stringify(orders));
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Ожидает обработки',
            'completed': 'Выполнен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    // Уведомления
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Обработчик главной кнопки Telegram
    handleMainButtonClick() {
        // Логика зависит от текущего состояния приложения
        if (this.currentSection === 'cart') {
            this.checkout();
        }
    }

    checkout() {
        if (!this.cart || this.cart.items.length === 0) {
            this.showNotification('Корзина пуста', 'warning');
            return;
        }
        
        const orderData = {
            items: this.cart.items,
            total: this.cart.getTotal()
        };
        
        const order = window.telegramAPI.createOrder(orderData);
        this.saveOrder(order);
        
        // Очищаем корзину
        this.cart.clear();
        
        this.showNotification('Заказ оформлен! Ожидайте связи с администратором.', 'success');
        
        // Возвращаемся в главное меню
        setTimeout(() => {
            this.showMainMenu();
        }, 2000);
    }

    // Утилиты
    formatPrice(price) {
        return window.telegramAPI?.formatPrice(price) || `${price} ₽`;
    }

    formatDate(date) {
        return window.telegramAPI?.formatDate(date) || new Date(date).toLocaleDateString('ru-RU');
    }
}

// Глобальные функции для HTML
window.showSection = (sectionId) => {
    if (window.app) {
        window.app.showSection(sectionId);
    }
};

window.showMainMenu = () => {
    if (window.app) {
        window.app.showMainMenu();
    }
};

window.goBack = () => {
    if (window.app) {
        window.app.goBack();
    }
};

window.showCart = () => {
    if (window.app) {
        window.app.showCart();
    }
};

window.showOrderHistory = () => {
    if (window.app) {
        window.app.showOrderHistory();
    }
};

window.showSupport = () => {
    if (window.app) {
        window.app.showSupport();
    }
};

window.closeModal = () => {
    if (window.app) {
        window.app.closeModal();
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PSStoreApp();
});