/*
  Логіка сайту: авторизація адміністратора, керування посібниками,
  форматування тексту, вибір іконки для теми, інтеграція з Gemini API
  і збереження даних у localStorage.
  УВАГА! API‑ключ у коді є публічним лише для демонстрації.
*/
document.addEventListener('DOMContentLoaded', () => {
  // Елементи авторизації
  const loginButton = document.getElementById('login-button');
  const adminButton = document.getElementById('admin-button');
  const loginModal = document.getElementById('login-modal');
  const loginSubmit = document.getElementById('login-submit');
  const loginCancel = document.getElementById('login-cancel');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveButton = document.getElementById('save-button');

  // Елементи посібника
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const articleListEl = document.getElementById('article-list');
  const newArticleButton = document.getElementById('new-article-button');
  const articleTitleEl = document.getElementById('article-title');
  const articleDescriptionEl = document.getElementById('article-description');
  const articleContentEl = document.getElementById('article-content');
  const articleIconEl = document.getElementById('article-icon');
  const editorToolbar = document.getElementById('editor-toolbar');
  const iconInput = document.getElementById('icon-input');

  // Елементи чату
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');
  const chatClose = document.getElementById('chat-close');
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');

  let isAdmin = false;
  let articles = [];
  let currentArticleId = null;

  // Завантажити посібники з localStorage
  function loadArticles() {
    try {
      articles = JSON.parse(localStorage.getItem('articles')) || [];
    } catch {
      articles = [];
    }
  }
  function saveArticles() {
    localStorage.setItem('articles', JSON.stringify(articles));
  }

  // Відобразити список посібників
  function renderArticleList() {
    articleListEl.innerHTML = '';
    if (articles.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = 'Немає посібників';
      emptyMsg.style.color = '#666666';
      articleListEl.appendChild(emptyMsg);
    } else {
      articles.forEach((article) => {
        const item = document.createElement('div');
        item.classList.add('article-item');
        if (article.id === currentArticleId) {
          item.classList.add('active');
        }
        item.innerHTML =
          '<strong>' +
          article.title +
          '</strong><br/><small>' +
          (article.description || '') +
          '</small>';
        item.addEventListener('click', () => {
          selectArticle(article.id);
        });
        articleListEl.appendChild(item);
      });
    }
    if (isAdmin) {
      newArticleButton.classList.remove('hidden');
    } else {
      newArticleButton.classList.add('hidden');
    }
  }

  // Відобразити вибрану статтю
  function selectArticle(id) {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    currentArticleId = id;
    Array.from(articleListEl.children).forEach((child) =>
      child.classList.remove('active')
    );
    const index = articles.findIndex((a) => a.id === id);
    const activeEl = articleListEl.children[index];
    if (activeEl) activeEl.classList.add('active');

    articleTitleEl.textContent = article.title;
    articleDescriptionEl.textContent = article.description;
    if (article.icon) {
      articleIconEl.src = article.icon;
      articleIconEl.classList.remove('hidden');
    } else {
      articleIconEl.classList.add('hidden');
    }
    articleContentEl.innerHTML = article.content || '';
    if (isAdmin) {
      articleContentEl.setAttribute('contenteditable', 'true');
      editorToolbar.classList.remove('hidden');
    } else {
      articleContentEl.setAttribute('contenteditable', 'false');
      editorToolbar.classList.add('hidden');
    }
  }

  // Створити нову статтю
  function createNewArticle() {
    const title = prompt('Введіть назву посібника');
    if (!title) return;
    const description = prompt('Введіть короткий опис (необов’язково)') || '';
    const id = Date.now();
    const newArticle = {
      id,
      title,
      description,
      icon: '',
      content: '<p>Новий посібник...</p>',
    };
    articles.push(newArticle);
    saveArticles();
    renderArticleList();
    selectArticle(id);
  }

  // Зберегти поточну статтю
  function saveCurrentArticle() {
    if (!isAdmin || currentArticleId === null) return;
    const article = articles.find((a) => a.id === currentArticleId);
    if (!article) return;
    article.title = articleTitleEl.textContent;
    article.description = articleDescriptionEl.textContent;
    article.content = articleContentEl.innerHTML;
    saveArticles();
    renderArticleList();
  }

  // Перемикання бічної панелі
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  newArticleButton.addEventListener('click', () => {
    createNewArticle();
  });

  saveButton.addEventListener('click', () => {
    saveCurrentArticle();
    alert('Зміни збережено.');
  });

  // Авторизація
  loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });
  loginCancel.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
  });
  loginSubmit.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (username === 'admin' && password === 'Luka@2016') {
      isAdmin = true;
      loginModal.classList.add('hidden');
      loginButton.classList.add('hidden');
      adminButton.classList.remove('hidden');
      saveButton.classList.remove('hidden');
      newArticleButton.classList.remove('hidden');
      if (currentArticleId !== null) {
        articleContentEl.setAttribute('contenteditable', 'true');
        editorToolbar.classList.remove('hidden');
      }
    } else {
      alert('Неправильні облікові дані.');
    }
  });

  adminButton.addEventListener('click', () => {
    if (!isAdmin) return;
    editorToolbar.classList.toggle('hidden');
  });

  // Форматування тексту
  editorToolbar.addEventListener('click', (e) => {
    const command = e.target.getAttribute('data-command');
    if (command) {
      document.execCommand(command, false, null);
      e.preventDefault();
    }
  });

  // Завантаження іконки
  iconInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      const dataUrl = evt.target.result.toString();
      if (currentArticleId !== null) {
        const article = articles.find((a) => a.id === currentArticleId);
        if (article) {
          article.icon = dataUrl;
          articleIconEl.src = dataUrl;
          articleIconEl.classList.remove('hidden');
          saveArticles();
          renderArticleList();
        }
      }
    };
    reader.readAsDataURL(file);
  });

  // Початкове завантаження
  loadArticles();
  renderArticleList();
  if (articles.length > 0) {
    selectArticle(articles[0].id);
  }

  // Чат: відкриття і закриття
  chatToggle.addEventListener('click', () => {
    chatContainer.classList.remove('hidden');
  });
  chatClose.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
  });

  // Чат: надсилання
  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) return;
    addMessage(query, 'user');
    userInput.value = '';
    try {
      const response = await callGeminiAPI(query);
      addMessage(response, 'assistant');
    } catch {
      addMessage('Помилка при отриманні відповіді.', 'assistant');
    }
  }
  sendButton.addEventListener('click', () => {
    sendMessage();
  });
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  // Виклик Gemini API
  async function callGeminiAPI(prompt) {
    const apiKey = 'AIzaSyDVfi0aGOBxzXbHdkNOAwPKloU13YymJJ4';
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data && data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content.parts;
      return parts.map((p) => p.text).join('\n');
    }
    return 'Без відповіді.';
  }
});
