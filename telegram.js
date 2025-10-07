// telegram.js
if (window.Telegram && Telegram.WebApp) {
  const tg = Telegram.WebApp;
  tg.ready();

  // Всегда показываем кнопку Назад
  tg.BackButton.show();

  // Обработка нажатия на кнопку Назад
  tg.BackButton.onClick(() => {
    const currentPage = window.location.pathname;
    
    if (currentPage === '/profile.html' || currentPage.endsWith('profile.html')) {
      // Если на странице профиля - возвращаемся на главную
      window.location.href = '/';
    } else if (window.history.length > 1) {
      // Если есть история браузера - используем её
      window.history.back();
    } else {
      // Если истории нет - закрываем приложение
      tg.close();
    }
  });

  // Настройка внешнего вида
  tg.expand(); // Раскрываем на весь экран
  tg.setHeaderColor('#0d0f1a'); // Цвет шапки
  tg.setBackgroundColor('#0d0f1a'); // Цвет фона
  
  console.log('Telegram WebApp initialized with BackButton');
}
