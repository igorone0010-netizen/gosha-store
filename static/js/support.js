// PlayStation Store - Support System

class SupportManager {
    constructor() {
        this.tickets = [];
        this.storageKey = 'ps_store_support_tickets';
        this.init();
    }

    init() {
        this.loadTickets();
        this.setupEventHandlers();
    }

    // Загрузка тикетов из localStorage
    loadTickets() {
        try {
            const savedTickets = localStorage.getItem(this.storageKey);
            if (savedTickets) {
                this.tickets = JSON.parse(savedTickets);
            }
        } catch (error) {
            console.error('Ошибка загрузки тикетов:', error);
            this.tickets = [];
        }
    }

    // Сохранение тикетов в localStorage
    saveTickets() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tickets));
        } catch (error) {
            console.error('Ошибка сохранения тикетов:', error);
        }
    }

    // Настройка обработчиков событий
    setupEventHandlers() {
        // Обработчик формы поддержки
        const supportForm = document.getElementById('support-form');
        if (supportForm) {
            supportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSupportFormSubmit(e);
            });
        }

        // Обработчик клика по контакту Telegram
        const telegramContact = document.querySelector('.contact-value');
        if (telegramContact && telegramContact.textContent.includes('@')) {
            telegramContact.addEventListener('click', () => {
                this.openTelegramBot();
            });
            telegramContact.style.cursor = 'pointer';
        }
    }

    // Обработка отправки формы поддержки
    handleSupportFormSubmit(event) {
        const formData = new FormData(event.target);
        const subject = document.getElementById('ticket-subject').value;
        const message = document.getElementById('ticket-message').value;

        if (!subject || !message.trim()) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        // Создаем тикет
        const ticket = this.createTicket({
            subject: subject,
            message: message.trim()
        });

        // Отправляем тикет
        this.submitTicket(ticket);

        // Очищаем форму
        event.target.reset();

        // Показываем уведомление
        this.showNotification('Тикет отправлен! Мы свяжемся с вами в ближайшее время.', 'success');

        // Haptic feedback
        if (window.telegramAPI) {
            window.telegramAPI.notificationFeedback('success');
        }
    }

    // Создание тикета
    createTicket(ticketData) {
        const ticket = {
            id: this.generateTicketId(),
            userId: window.telegramAPI?.getUserId() || 'anonymous',
            userName: window.telegramAPI?.getUserName() || 'Пользователь',
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'open',
            priority: this.calculatePriority(ticketData.subject),
            timestamp: new Date().toISOString(),
            responses: []
        };

        // Сохраняем тикет локально
        this.tickets.unshift(ticket);
        this.saveTickets();

        return ticket;
    }

    // Генерация ID тикета
    generateTicketId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `TKT-${timestamp}-${random}`;
    }

    // Расчет приоритета тикета
    calculatePriority(subject) {
        const highPriorityKeywords = ['оплата', 'деньги', 'не работает', 'ошибка', 'проблема'];
        const mediumPriorityKeywords = ['заказ', 'доставка', 'код'];
        
        const lowerSubject = subject.toLowerCase();
        
        if (highPriorityKeywords.some(keyword => lowerSubject.includes(keyword))) {
            return 'high';
        } else if (mediumPriorityKeywords.some(keyword => lowerSubject.includes(keyword))) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    // Отправка тикета
    async submitTicket(ticket) {
        try {
            // Отправляем через Telegram WebApp API
            if (window.telegramAPI) {
                window.telegramAPI.createSupportTicket({
                    subject: ticket.subject,
                    message: ticket.message
                });
            }

            // Отправляем через webhook (если настроен)
            await this.sendTicketToWebhook(ticket);

            // Обновляем статус тикета
            ticket.status = 'submitted';
            this.saveTickets();

        } catch (error) {
            console.error('Ошибка отправки тикета:', error);
            ticket.status = 'failed';
            this.saveTickets();
            this.showNotification('Ошибка отправки тикета. Попробуйте позже.', 'error');
        }
    }

    // Отправка тикета через webhook
    async sendTicketToWebhook(ticket) {
        try {
            const response = await fetch('/webhook/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'support_ticket',
                    ticket: ticket,
                    user: window.telegramAPI?.getUser()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Тикет отправлен через webhook');
        } catch (error) {
            console.error('Ошибка отправки через webhook:', error);
            // Не выбрасываем ошибку, так как основная отправка через Telegram API
        }
    }

    // Открытие бота Telegram
    openTelegramBot() {
        const botUsername = 'GoshaStoreBot'; // Замените на ваш бот
        
        if (window.telegramAPI && window.telegramAPI.tg) {
            // Если в Telegram, открываем бота
            window.telegramAPI.tg.openTelegramLink(`https://t.me/${botUsername}`);
        } else {
            // Если не в Telegram, открываем в новом окне
            window.open(`https://t.me/${botUsername}`, '_blank');
        }

        if (window.telegramAPI) {
            window.telegramAPI.impactFeedback('medium');
        }
    }

    // Получение списка тикетов пользователя
    getUserTickets() {
        const userId = window.telegramAPI?.getUserId();
        if (!userId) return [];

        return this.tickets.filter(ticket => ticket.userId === userId);
    }

    // Получение тикета по ID
    getTicketById(ticketId) {
        return this.tickets.find(ticket => ticket.id === ticketId);
    }

    // Обновление статуса тикета
    updateTicketStatus(ticketId, status) {
        const ticket = this.getTicketById(ticketId);
        if (ticket) {
            ticket.status = status;
            ticket.updatedAt = new Date().toISOString();
            this.saveTickets();
        }
    }

    // Добавление ответа к тикету
    addTicketResponse(ticketId, response) {
        const ticket = this.getTicketById(ticketId);
        if (ticket) {
            ticket.responses.push({
                id: Date.now(),
                message: response.message,
                author: response.author || 'Support',
                timestamp: new Date().toISOString()
            });
            ticket.updatedAt = new Date().toISOString();
            this.saveTickets();
        }
    }

    // Отображение истории тикетов
    renderTicketHistory() {
        const userTickets = this.getUserTickets();
        const container = document.getElementById('ticket-history');
        
        if (!container) return;

        if (userTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎫</div>
                    <p>У вас пока нет обращений в поддержку</p>
                </div>
            `;
            return;
        }

        container.innerHTML = userTickets.map(ticket => `
            <div class="ticket-item" onclick="supportManager.showTicketDetails('${ticket.id}')">
                <div class="ticket-header">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="ticket-date">${this.formatDate(ticket.timestamp)}</span>
                </div>
                <div class="ticket-subject">${ticket.subject}</div>
                <div class="ticket-status status-${ticket.status}">
                    ${this.getStatusText(ticket.status)}
                </div>
                <div class="ticket-priority priority-${ticket.priority}">
                    ${this.getPriorityText(ticket.priority)}
                </div>
            </div>
        `).join('');
    }

    // Показать детали тикета
    showTicketDetails(ticketId) {
        const ticket = this.getTicketById(ticketId);
        if (!ticket) return;

        const modal = document.getElementById('ticket-modal') || this.createTicketModal();
        const content = modal.querySelector('.modal-content');

        content.innerHTML = `
            <span class="close" onclick="supportManager.closeTicketModal()">&times;</span>
            <h2>Тикет ${ticket.id}</h2>
            <div class="ticket-details">
                <div class="ticket-meta">
                    <div class="meta-item">
                        <strong>Тема:</strong> ${ticket.subject}
                    </div>
                    <div class="meta-item">
                        <strong>Статус:</strong> 
                        <span class="status-badge status-${ticket.status}">
                            ${this.getStatusText(ticket.status)}
                        </span>
                    </div>
                    <div class="meta-item">
                        <strong>Приоритет:</strong> 
                        <span class="priority-badge priority-${ticket.priority}">
                            ${this.getPriorityText(ticket.priority)}
                        </span>
                    </div>
                    <div class="meta-item">
                        <strong>Создан:</strong> ${this.formatDate(ticket.timestamp)}
                    </div>
                </div>
                
                <div class="ticket-message">
                    <h3>Сообщение:</h3>
                    <p>${ticket.message}</p>
                </div>
                
                ${ticket.responses.length > 0 ? `
                    <div class="ticket-responses">
                        <h3>Ответы:</h3>
                        ${ticket.responses.map(response => `
                            <div class="response-item">
                                <div class="response-header">
                                    <strong>${response.author}</strong>
                                    <span class="response-date">${this.formatDate(response.timestamp)}</span>
                                </div>
                                <div class="response-message">${response.message}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    // Создание модального окна для тикета
    createTicketModal() {
        const modal = document.createElement('div');
        modal.id = 'ticket-modal';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-content"></div>';
        document.body.appendChild(modal);
        return modal;
    }

    // Закрытие модального окна тикета
    closeTicketModal() {
        const modal = document.getElementById('ticket-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Получение текста статуса
    getStatusText(status) {
        const statusMap = {
            'open': 'Открыт',
            'submitted': 'Отправлен',
            'in_progress': 'В обработке',
            'waiting_response': 'Ожидает ответа',
            'resolved': 'Решен',
            'closed': 'Закрыт',
            'failed': 'Ошибка отправки'
        };
        return statusMap[status] || status;
    }

    // Получение текста приоритета
    getPriorityText(priority) {
        const priorityMap = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'urgent': 'Срочный'
        };
        return priorityMap[priority] || priority;
    }

    // Форматирование даты
    formatDate(dateString) {
        if (window.telegramAPI && window.telegramAPI.formatDate) {
            return window.telegramAPI.formatDate(dateString);
        }
        
        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Fallback
            alert(message);
        }
    }

    // Получение статистики тикетов
    getTicketStats() {
        const userTickets = this.getUserTickets();
        
        const stats = {
            total: userTickets.length,
            open: userTickets.filter(t => ['open', 'submitted', 'in_progress'].includes(t.status)).length,
            resolved: userTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
            failed: userTickets.filter(t => t.status === 'failed').length
        };

        return stats;
    }

    // Экспорт тикетов для отладки
    exportTickets() {
        return {
            tickets: this.tickets,
            userTickets: this.getUserTickets(),
            stats: this.getTicketStats()
        };
    }

    // Очистка старых тикетов (старше 30 дней)
    cleanupOldTickets() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const initialCount = this.tickets.length;
        this.tickets = this.tickets.filter(ticket => {
            const ticketDate = new Date(ticket.timestamp);
            return ticketDate > thirtyDaysAgo || ['open', 'submitted', 'in_progress'].includes(ticket.status);
        });

        if (this.tickets.length < initialCount) {
            this.saveTickets();
            console.log(`Очищено ${initialCount - this.tickets.length} старых тикетов`);
        }
    }

    // Автоматическая очистка при инициализации
    autoCleanup() {
        // Очищаем старые тикеты раз в день
        const lastCleanup = localStorage.getItem('ps_store_last_cleanup');
        const now = new Date().toDateString();
        
        if (lastCleanup !== now) {
            this.cleanupOldTickets();
            localStorage.setItem('ps_store_last_cleanup', now);
        }
    }
}

// Создаем глобальный экземпляр
window.SupportManager = SupportManager;

// Инициализируем менеджер поддержки при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (!window.supportManager) {
        window.supportManager = new SupportManager();
        window.supportManager.autoCleanup();
    }
});