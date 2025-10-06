// PlayStation Store - Cart Management

class Cart {
    constructor() {
        this.items = [];
        this.storageKey = 'ps_store_cart';
        this.loadFromStorage();
        this.updateUI();
    }

    // Загрузка корзины из localStorage
    loadFromStorage() {
        try {
            const savedCart = localStorage.getItem(this.storageKey);
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            this.items = [];
        }
    }

    // Сохранение корзины в localStorage
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.error('Ошибка сохранения корзины:', error);
        }
    }

    // Добавление товара в корзину
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }
        
        this.saveToStorage();
        this.updateUI();
        
        // Haptic feedback
        if (window.telegramAPI) {
            window.telegramAPI.impactFeedback('light');
        }
    }

    // Удаление товара из корзины
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateUI();
        this.render(); // Перерисовываем корзину
        
        if (window.telegramAPI) {
            window.telegramAPI.impactFeedback('medium');
        }
    }

    // Изменение количества товара
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateUI();
                this.render();
            }
        }
        
        if (window.telegramAPI) {
            window.telegramAPI.selectionFeedback();
        }
    }

    // Очистка корзины
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
        this.render();
    }

    // Получение общего количества товаров
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Получение общей стоимости
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Обновление UI элементов
    updateUI() {
        const totalItems = this.getTotalItems();
        
        // Обновляем счетчики в кнопках корзины
        const cartCounts = document.querySelectorAll('#cart-count, #cart-count-plus, #cart-count-wallet');
        cartCounts.forEach(element => {
            if (element) {
                element.textContent = totalItems;
            }
        });
        
        // Обновляем badge в нижней навигации
        const navCartCount = document.getElementById('nav-cart-count');
        if (navCartCount) {
            navCartCount.textContent = totalItems;
            if (totalItems > 0) {
                navCartCount.classList.add('show');
            } else {
                navCartCount.classList.remove('show');
            }
        }
        
        // Обновляем главную кнопку Telegram
        this.updateMainButton();
    }

    // Обновление главной кнопки Telegram
    updateMainButton() {
        if (!window.telegramAPI) return;
        
        const currentSection = document.querySelector('.content-section.active');
        if (currentSection && currentSection.id === 'cart') {
            const totalItems = this.getTotalItems();
            const total = this.getTotal();
            
            if (totalItems > 0) {
                const buttonText = `Оформить заказ • ${this.formatPrice(total)}`;
                window.telegramAPI.showMainButton(buttonText, () => {
                    if (window.app) {
                        window.app.checkout();
                    }
                });
            } else {
                window.telegramAPI.hideMainButton();
            }
        }
    }

    // Отрисовка корзины
    render() {
        const cartContainer = document.getElementById('cart-items');
        const totalPriceElement = document.getElementById('total-price');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (!cartContainer) return;
        
        if (this.items.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <p>Ваша корзина пуста</p>
                    <p style="opacity: 0.7; font-size: 14px; margin-top: 8px;">
                        Добавьте товары из каталога
                    </p>
                </div>
            `;
            
            if (totalPriceElement) {
                totalPriceElement.textContent = '0 ₽';
            }
            
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
            }
            
            // Скрываем главную кнопку
            if (window.telegramAPI) {
                window.telegramAPI.hideMainButton();
            }
            
            return;
        }
        
        // Отрисовка товаров в корзине
        cartContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/80x80/2d2d2d/ffffff?text=No+Image'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">
                        ${item.category}
                    </div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                        −
                    </button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                        +
                    </button>
                    <button class="remove-btn" onclick="cart.removeItem(${item.id})" title="Удалить товар">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        
        // Обновляем общую стоимость
        const total = this.getTotal();
        if (totalPriceElement) {
            totalPriceElement.textContent = this.formatPrice(total);
        }
        
        // Активируем кнопку оформления заказа
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
        }
        
        // Обновляем главную кнопку
        this.updateMainButton();
    }

    // Получение данных для заказа
    getOrderData() {
        return {
            items: this.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: item.category
            })),
            total: this.getTotal(),
            totalItems: this.getTotalItems()
        };
    }

    // Форматирование цены
    formatPrice(price) {
        if (window.telegramAPI && window.telegramAPI.formatPrice) {
            return window.telegramAPI.formatPrice(price);
        }
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Проверка наличия товара в корзине
    hasItem(productId) {
        return this.items.some(item => item.id === productId);
    }

    // Получение количества конкретного товара
    getItemQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        return item ? item.quantity : 0;
    }

    // Экспорт корзины для отладки
    export() {
        return {
            items: this.items,
            total: this.getTotal(),
            totalItems: this.getTotalItems()
        };
    }

    // Импорт корзины (для восстановления)
    import(cartData) {
        if (cartData && Array.isArray(cartData.items)) {
            this.items = cartData.items;
            this.saveToStorage();
            this.updateUI();
            this.render();
        }
    }
}

// Глобальные функции для HTML
window.checkout = () => {
    if (window.app) {
        window.app.checkout();
    }
};

// Создаем глобальный экземпляр корзины
window.Cart = Cart;

// Инициализируем корзину при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (!window.cart) {
        window.cart = new Cart();
    }
});