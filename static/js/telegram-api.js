// Telegram Web App API Integration

class TelegramAPI {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.user = null;
        this.init();
    }

    init() {
        if (!this.tg) {
            console.warn('Telegram WebApp не найден. Работаем в режиме разработки.');
            this.mockTelegramData();
            return;
        }

        // Инициализация Telegram WebApp
        this.tg.ready();
        this.tg.expand();
        
        // Получение данных пользователя
        this.user = this.tg.initDataUnsafe?.user;
        
        // Настройка темы
        this.setupTheme();
        
        // Настройка кнопок
        this.setupButtons();
        
        // Обработчики событий
        this.setupEventHandlers();
        
        console.log('Telegram WebApp инициализирован', this.user);
    }

    mockTelegramData() {
        // Мок данные для разработки
        this.user = {
            id: 123456789,
            first_name: 'Gosha',
            last_name: 'Test',
            username: 'gosha_test',
            language_code: 'ru'
        };
        
        // Мок объект Telegram
        this.tg = {
            ready: () => {},
            expand: () => {},
            close: () => console.log('Закрытие приложения'),
            sendData: (data) => console.log('Отправка данных:', data),
            showAlert: (message) => alert(message),
            showConfirm: (message, callback) => {
                const result = confirm(message);
                callback(result);
            },
            showPopup: (params, callback) => {
                const result = confirm(params.message);
                callback(result ? 'ok' : 'cancel');
            },
            MainButton: {
                text: '',
                color: '#0070f3',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                show: function() { this.isVisible = true; },
                hide: function() { this.isVisible = false; },
                enable: function() { this.isActive = true; },
                disable: function() { this.isActive = false; },
                setText: function(text) { this.text = text; },
                onClick: function(callback) { this.callback = callback; },
                offClick: function(callback) { this.callback = null; }
            },
            BackButton: {
                isVisible: false,
                show: function() { this.isVisible = true; },
                hide: function() { this.isVisible = false; },
                onClick: function(callback) { this.callback = callback; },
                offClick: function(callback) { this.callback = null; }
            },
            HapticFeedback: {
                impactOccurred: (style) => console.log('Haptic feedback:', style),
                notificationOccurred: (type) => console.log('Notification feedback:', type),
                selectionChanged: () => console.log('Selection changed')
            }
        };
    }

    setupTheme() {
        if (!this.tg) return;
        
        // Применение темы Telegram
        const themeParams = this.tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#000000');
            document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-link-color', themeParams.link_color || '#0070f3');
            document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#0070f3');
            document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        }
    }

    setupButtons() {
        if (!this.tg) return;

        // Настройка главной кнопки
        this.tg.MainButton.color = '#00ff88';
        this.tg.MainButton.textColor = '#000000';
        
        // Настройка кнопки "Назад"
        this.tg.BackButton.onClick(() => {
            this.goBack();
        });
    }

    setupEventHandlers() {
        if (!this.tg) return;

        // Обработчик закрытия приложения
        this.tg.onEvent('mainButtonClicked', () => {
            this.handleMainButtonClick();
        });

        // Обработчик изменения viewport
        this.tg.onEvent('viewportChanged', () => {
            this.handleViewportChange();
        });
    }

    // Методы для работы с пользователем
    getUser() {
        return this.user;
    }

    getUserName() {
        if (!this.user) return 'Пользователь';
        return this.user.first_name || this.user.username || 'Пользователь';
    }

    getUserId() {
        return this.user?.id || null;
    }

    // Методы для работы с кнопками
    showMainButton(text, callback) {
        if (!this.tg) return;
        
        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
        this.tg.MainButton.onClick(callback);
    }

    hideMainButton() {
        if (!this.tg) return;
        
        this.tg.MainButton.hide();
        this.tg.MainButton.offClick();
    }

    showBackButton() {
        if (!this.tg) return;
        this.tg.BackButton.show();
    }

    hideBackButton() {
        if (!this.tg) return;
        this.tg.BackButton.hide();
    }

    // Методы для уведомлений
    showAlert(message) {
        if (!this.tg) {
            alert(message);
            return;
        }
        this.tg.showAlert(message);
    }

    showConfirm(message, callback) {
        if (!this.tg) {
            const result = confirm(message);
            callback(result);
            return;
        }
        this.tg.showConfirm(message, callback);
    }

    showPopup(params, callback) {
        if (!this.tg) {
            const result = confirm(params.message);
            callback(result ? 'ok' : 'cancel');
            return;
        }
        this.tg.showPopup(params, callback);
    }

    // Методы для haptic feedback
    impactFeedback(style = 'medium') {
        if (!this.tg) return;
        this.tg.HapticFeedback.impactOccurred(style);
    }

    notificationFeedback(type = 'success') {
        if (!this.tg) return;
        this.tg.HapticFeedback.notificationOccurred(type);
    }

    selectionFeedback() {
        if (!this.tg) return;
        this.tg.HapticFeedback.selectionChanged();
    }

    // Методы для отправки данных
    sendData(data) {
        if (!this.tg) {
            console.log('Отправка данных:', data);
            return;
        }
        this.tg.sendData(JSON.stringify(data));
    }

    // Методы навигации
    goBack() {
        // Логика возврата назад
        const currentSection = document.querySelector('.content-section.active, .main-content.active');
        if (currentSection && currentSection.id !== 'main-menu') {
            this.showMainMenu();
        } else {
            this.close();
        }
    }

    close() {
        if (!this.tg) {
            window.close();
            return;
        }
        this.tg.close();
    }

    // Обработчики событий
    handleMainButtonClick() {
        // Обработка нажатия главной кнопки
        const event = new CustomEvent('mainButtonClicked');
        document.dispatchEvent(event);
    }

    handleViewportChange() {
        // Обработка изменения viewport
        const event = new CustomEvent('viewportChanged');
        document.dispatchEvent(event);
    }

    showMainMenu() {
        // Показать главное меню
        const event = new CustomEvent('showMainMenu');
        document.dispatchEvent(event);
    }

    // Методы для работы с заказами
    createOrder(orderData) {
        const order = {
            id: Date.now(),
            userId: this.getUserId(),
            userName: this.getUserName(),
            items: orderData.items,
            total: orderData.total,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Отправляем данные заказа боту
        this.sendOrderToBot(order);
        
        return order;
    }

    sendOrderToBot(order) {
        // Формируем сообщение для бота
        const message = {
            type: 'new_order',
            order: order,
            user: this.user
        };

        // Отправляем данные боту через Telegram WebApp API
        this.sendData(message);
        
        // Также можем отправить через webhook (если настроен)
        this.sendToWebhook(message);
    }

    async sendToWebhook(data) {
        try {
            const response = await fetch('/webhook/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('Заказ отправлен через webhook');
            }
        } catch (error) {
            console.error('Ошибка отправки через webhook:', error);
        }
    }

    // Методы для работы с тикетами поддержки
    createSupportTicket(ticketData) {
        const ticket = {
            id: Date.now(),
            userId: this.getUserId(),
            userName: this.getUserName(),
            subject: ticketData.subject,
            message: ticketData.message,
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        // Отправляем тикет боту
        this.sendTicketToBot(ticket);
        
        return ticket;
    }

    sendTicketToBot(ticket) {
        const message = {
            type: 'support_ticket',
            ticket: ticket,
            user: this.user
        };

        this.sendData(message);
        this.sendToWebhook(message);
    }

    // Утилиты
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Создаем глобальный экземпляр
window.telegramAPI = new TelegramAPI();