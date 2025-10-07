// telegram.js
function initTelegramWebApp() {
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Инициализация
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#0d0f1a');
        tg.setBackgroundColor('#0d0f1a');
        
        // Функция для показа кнопки Назад
        function showBackButton() {
            tg.BackButton.show();
            tg.BackButton.onClick(handleBackClick);
        }
        
        // Функция для скрытия кнопки Назад
        function hideBackButton() {
            tg.BackButton.hide();
            tg.BackButton.offClick(handleBackClick);
        }
        
        // Обработчик нажатия кнопки Назад
        function handleBackClick() {
            const currentPath = window.location.pathname;
            
            if (currentPath.includes('profile.html')) {
                // Если на странице профиля - возвращаемся на главную
                window.location.href = '/';
            } else {
                // На главной странице - закрываем приложение
                tg.close();
            }
        }
        
        // Определяем текущую страницу и показываем/скрываем кнопку
        function setupBackButton() {
            const currentPath = window.location.pathname;
            
            if (currentPath.includes('profile.html')) {
                // На странице профиля показываем кнопку Назад
                showBackButton();
            } else {
                // На главной странице скрываем кнопку Назад (будет кнопка Закрыть)
                hideBackButton();
            }
        }
        
        // Инициализируем кнопку при загрузке
        setupBackButton();
        
        // Слушаем изменения истории (если используете pushState)
        window.addEventListener('popstate', setupBackButton);
        
        console.log('Telegram WebApp initialized');
        
        return tg;
    }
    return null;
}

// Запускаем инициализацию при загрузке
document.addEventListener('DOMContentLoaded', initTelegramWebApp);
