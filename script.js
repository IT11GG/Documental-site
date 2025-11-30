/*
  script.js містить логіку для: 
  – авторизації адміністратора та вмикання режиму редагування;
  – збереження зміненого контенту в localStorage;
  – інтеграції з Gemini API для чату з ШІ (flash-модель);
  – відкриття та закриття модального вікна чату та вікна авторизації.

  УВАГА! Включення секретного ключа безпосередньо у коді є небезпечною практикою, 
  але для цього демонстраційного проєкту ключ вставлено у відкритому вигляді.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Елементи для авторизації
  const loginButton = document.getElementById('login-button');
  const adminButton = document.getElementById('admin-button');
  const loginModal = document.getElementById('login-modal');
  const loginSubmit = document.getElementById('login-submit');
  const loginCancel = document.getElementById('login-cancel');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveButton = document.getElementById('save-button');
  const contentArea = document.getElementById('content-area');

  // Елементи чату
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');
  const chatClose = document.getElementById('chat-close');
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');

  // Відновити збережений контент при завантаженні сторінки
  const savedContent = localStorage.getItem('savedContent');
  if (savedContent) {
    contentArea.innerHTML = savedContent;
  }

  /**
   * Показати модальне вікно авторизації
   */
  loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  /**
   * Скасувати авторизацію та сховати модальне вікно
   */
  loginCancel.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
  });

  /**
   * Перевірити облікові дані. Якщо вони правильні, активувати режим редагування.
   */
  loginSubmit.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username === 'admin' && password === 'Luka@2016') {
      // Авторизація успішна
      loginModal.classList.add('hidden');
      loginButton.classList.add('hidden');
      adminButton.classList.remove('hidden');
      saveButton.classList.remove('hidden');
      enableEditing();
    } else {
      alert('Неправильні облікові дані.');
    }
  });

  /**
   * Вмикає режим редагування для контенту, роблячи елементи редагованими.
   */
  function enableEditing() {
    // Увімкнути атрибут contenteditable для заголовків та абзаців
    contentArea.querySelectorAll('section, p, h2').forEach((elem) => {
      elem.setAttribute('contenteditable', 'true');
    });
  }

  /**
   * Зберегти змінений контент у локальному сховищі браузера
   */
  saveButton.addEventListener('click', () => {
    const newContent = contentArea.innerHTML;
    localStorage.setItem('savedContent', newContent);
    alert('Зміни збережено.');
  });

  /**
   * Відкрити вікно чату
   */
  chatToggle.addEventListener('click', () => {
    chatContainer.classList.remove('hidden');
  });

  /**
   * Закрити вікно чату
   */
  chatClose.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
  });

  /**
   * Надіслати повідомлення при натисканні кнопки
   */
  sendButton.addEventListener('click', () => {
    sendMessage();
  });

  /**
   * Надіслати повідомлення при натисканні Enter
   */
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  /**
   * Додає повідомлення у вікно чату
   * @param {string} text Текст повідомлення
   * @param {string} sender Відправник ('user' або 'assistant')
   */
  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    // Автопрокрутка вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Відправити запит до ШІ та відобразити відповідь
   */
  async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) {
      return;
    }
    // Додати повідомлення користувача
    addMessage(query, 'user');
    userInput.value = '';
    try {
      // Отримати відповідь від моделі Gemini
      const response = await callGeminiAPI(query);
      addMessage(response, 'assistant');
    } catch (error) {
      addMessage('Помилка при отриманні відповіді.', 'assistant');
    }
  }

  /**
   * Запит до Gemini API (модель gemini-1.5-flash)
   * @param {string} prompt Запит користувача
   * @returns {Promise<string>} Відповідь від ШІ
   */
  async function callGeminiAPI(prompt) {
    // УВАГА! Збереження ключа у відкритому коді небезпечно. Для реального проєкту
    // використовуйте серверну частину або змінні оточення для захисту ключа.
    const apiKey = 'AIzaSyDVfi0aGOBxzXbHdkNOAwPKloU13YymJJ4';
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
      encodeURIComponent(apiKey);
    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // Обробка відповіді: вибрати текст з першого кандидата
    if (data && data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content.parts;
      // Поєднати всі частини тексту, якщо вони є
      return parts.map((p) => p.text).join('\n');
    }
    return 'Без відповіді.';
  }
});
