// telegram.js — единый файл для всех страниц
(function () {
  function initTelegramBehavior() {
    if (!window.Telegram || !Telegram.WebApp) {
      console.warn('Telegram WebApp API не найден — откройте приложение через Telegram.');
      return false;
    }

    const tg = Telegram.WebApp;
    try { tg.ready(); } catch (e) {}
    try { tg.expand(); } catch (e) {}

    // безопасно установить тему (если поддерживается)
    try {
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#0d0f1a');
    } catch (e) {}

    // обработчик для BackButton
    function handleBackClick() {
      const path = window.location.pathname;
      // если мы на странице профиля — вернуть на главную
      if (path.includes('profile.html')) {
        window.location.href = '/';
      } else {
        // в остальных случаях закрываем WebApp
        try { tg.close(); } catch (e) { window.close(); }
      }
    }

    // регистрируем обработчик один раз
    if (!window.__tgBackRegistered) {
      try {
        tg.onEvent && tg.onEvent('backButtonClicked', handleBackClick);
      } catch (e) {
        // fallback: older SDK may expose BackButton.onClick
        try { tg.BackButton && tg.BackButton.onClick && tg.BackButton.onClick(handleBackClick); } catch (ee) {}
      }
      window.__tgBackRegistered = true;
    }

    // показать/скрыть BackButton в зависимости от текущего пути
    function updateBackButtonVisibility() {
      const path = window.location.pathname;
      if (path.includes('profile.html')) {
        // небольшой таймаут чтобы WebView точно инициализировался
        setTimeout(() => {
          try { tg.BackButton && tg.BackButton.show && tg.BackButton.show(); } catch (e) { /* ignore */ }
        }, 200);
      } else {
        try { tg.BackButton && tg.BackButton.hide && tg.BackButton.hide(); } catch (e) {}
      }
    }

    // initial update
    updateBackButtonVisibility();

    // если используется pushState / popstate навигация
    window.addEventListener('popstate', updateBackButtonVisibility);
    window.addEventListener('hashchange', updateBackButtonVisibility);

    // заполним имя пользователя в элементе #username, если он есть
    const user = tg.initDataUnsafe?.user;
    if (user && user.username) {
      const el = document.getElementById('username');
      if (el) el.textContent = '@' + user.username;
    }

    return true;
  }

  // Попробуем инициализировать сразу, иначе будем поллить
  if (!initTelegramBehavior()) {
    let tries = 0;
    const poll = setInterval(() => {
      if (initTelegramBehavior() || ++tries > 20) {
        clearInterval(poll);
      }
    }, 150);
  }
})();
