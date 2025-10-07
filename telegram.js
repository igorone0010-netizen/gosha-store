// static/telegram.js
if (window.Telegram && Telegram.WebApp) {
  const tg = Telegram.WebApp;
  tg.ready();

  // Показать кнопку "Назад"
  tg.BackButton.show();

  tg.BackButton.onClick(() => {
    if (window.history.length > 1) {
      window.history.back(); // Назад по истории
    } else {
      tg.close(); // Закрыть WebApp, если истории нет
    }
  });
}
