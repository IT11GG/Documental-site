/*
  Логіка:
  - авторизація адміна (admin / Luka@2016)
  - створення / вибір посібників
  - редагування тексту + форматування + іконка
  - збереження всього (масив посібників) у localStorage
  - чат з Gemini (gemini-1.5-flash)
*/

document.addEventListener("DOMContentLoaded", () => {
  // Авторизація
  const loginButton = document.getElementById("login-button");
  const adminButton = document.getElementById("admin-button");
  const loginModal = document.getElementById("login-modal");
  const loginSubmit = document.getElementById("login-submit");
  const loginCancel = document.getElementById("login-cancel");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const saveButton = document.getElementById("save-button");

  // Sidebar / контент
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const articleListEl = document.getElementById("article-list");
  const newArticleButton = document.getElementById("new-article-button");

  const articleTitleEl = document.getElementById("article-title");
  const articleDescriptionEl = document.getElementById("article-description");
  const articleContentEl = document.getElementById("article-content");
  const articleIconEl = document.getElementById("article-icon");

  const editorToolbar = document.getElementById("editor-toolbar");
  const iconInput = document.getElementById("icon-input");

  // Чат
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");
  const chatClose = document.getElementById("chat-close");
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatMessages = document.getElementById("chat-messages");

  let isAdmin = false;
  let articles = [];
  let currentArticleId = null;

  // ---------- ЗАГРУЗКА / ЗБЕРЕЖЕННЯ ----------

  function loadArticles() {
    try {
      const raw = localStorage.getItem("articles");
      articles = raw ? JSON.parse(raw) : [];
    } catch (e) {
      articles = [];
    }
  }

  function saveArticles() {
    localStorage.setItem("articles", JSON.stringify(articles));
  }

  // ---------- РЕНДЕР СПИСКУ ПОСІБНИКІВ ----------

  function renderArticleList() {
    articleListEl.innerHTML = "";

    if (articles.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "Немає посібників";
      empty.style.color = "#666";
      articleListEl.appendChild(empty);
    } else {
      articles.forEach((article, index) => {
        const item = document.createElement("div");
        item.classList.add("article-item");
        if (article.id === currentArticleId) {
          item.classList.add("active");
        }
        item.innerHTML =
          "<strong>" +
          article.title +
          "</strong><br><small>" +
          (article.description || "") +
          "</small>";

        item.addEventListener("click", () => {
          selectArticle(article.id);
        });

        articleListEl.appendChild(item);
      });
    }

    if (isAdmin) {
      newArticleButton.classList.remove("hidden");
    } else {
      newArticleButton.classList.add("hidden");
    }
  }

  // ---------- ВИБІР ПОСІБНИКА ----------

  function selectArticle(id) {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    currentArticleId = id;

    // Підсвітка активного
    Array.from(articleListEl.children).forEach((el) =>
      el.classList.remove("active")
    );
    const idx = articles.findIndex((a) => a.id === id);
    if (idx >= 0 && articleListEl.children[idx]) {
      articleListEl.children[idx].classList.add("active");
    }

    // Заповнюємо поля
    articleTitleEl.textContent = article.title;
    articleDescriptionEl.textContent = article.description || "";
    articleContentEl.innerHTML = article.content || "";

    if (article.icon) {
      articleIconEl.src = article.icon;
      articleIconEl.classList.remove("hidden");
    } else {
      articleIconEl.classList.add("hidden");
    }

    if (isAdmin) {
      articleContentEl.setAttribute("contenteditable", "true");
      editorToolbar.classList.remove("hidden");
    } else {
      articleContentEl.setAttribute("contenteditable", "false");
      editorToolbar.classList.add("hidden");
    }
  }

  // ---------- СТВОРЕННЯ НОВОГО ПОСІБНИКА ----------

  function createNewArticle() {
    const title = prompt("Введіть назву посібника");
    if (!title) return;
    const description =
      prompt("Введіть короткий опис (необов’язково)") || "";

    const article = {
      id: Date.now(),
      title,
      description,
      icon: "",
      content: "<p>Новий посібник...</p>",
    };

    articles.push(article);
    saveArticles();
    renderArticleList();
    selectArticle(article.id);
  }

  // ---------- ЗБЕРЕЖЕННЯ ПОТОЧНОГО ----------

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

  // ---------- ОБРОБКА КНОПОК ----------

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  newArticleButton.addEventListener("click", () => {
    createNewArticle();
  });

  saveButton.addEventListener("click", () => {
    saveCurrentArticle();
    alert("Зміни збережено.");
  });

  // ---------- ЛОГІН АДМІНА ----------

  loginButton.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });

  loginCancel.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    usernameInput.value = "";
    passwordInput.value = "";
  });

  loginSubmit.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "admin" && password === "Luka@2016") {
      isAdmin = true;
      loginModal.classList.add("hidden");
      loginButton.classList.add("hidden");
      adminButton.classList.remove("hidden");
      saveButton.classList.remove("hidden");
      newArticleButton.classList.remove("hidden");

      if (currentArticleId !== null) {
        articleContentEl.setAttribute("contenteditable", "true");
        editorToolbar.classList.remove("hidden");
      }
    } else {
      alert("Неправильні облікові дані.");
    }
  });

  adminButton.addEventListener("click", () => {
    if (!isAdmin) return;
    editorToolbar.classList.toggle("hidden");
  });

  // ---------- ТЕКСТОВИЙ ТУЛБАР (B, U, S) ----------

  editorToolbar.addEventListener("click", (e) => {
    const command = e.target.getAttribute("data-command");
    if (!command) return;
    // Використовуємо старий, але простий execCommand
    document.execCommand(command, false, null);
  });

  // ---------- ІКОНКА ТЕМИ ----------

  iconInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || currentArticleId === null) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = String(evt.target.result);
      const article = articles.find((a) => a.id === currentArticleId);
      if (!article) return;
      article.icon = dataUrl;
      articleIconEl.src = dataUrl;
      articleIconEl.classList.remove("hidden");
      saveArticles();
      renderArticleList();
    };
    reader.readAsDataURL(file);
  });

  // ---------- ЧАТ ----------

  chatToggle.addEventListener("click", () => {
    chatContainer.classList.remove("hidden");
  });

  chatClose.addEventListener("click", () => {
    chatContainer.classList.add("hidden");
  });

  sendButton.addEventListener("click", () => {
    sendMessage();
  });

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const query = userInput.value.trim();
    if (!query) return;

    addMessage(query, "user");
    userInput.value = "";

    try {
      const reply = await callGeminiAPI(query);
      addMessage(reply, "assistant");
    } catch (e) {
      console.error(e);
      addMessage("Помилка при отриманні відповіді.", "assistant");
    }
  }

  // Виклик Gemini API
  async function callGeminiAPI(prompt) {
    // УВАГА: тримати ключ у фронтенді небезпечно, це лише для демо.
    const apiKey = "AIzaSyDVfi0aGOBxzXbHdkNOAwPKloU13YymJJ4";
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data && data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content.parts || [];
      return parts.map((p) => p.text || "").join("\n").trim() || "Без відповіді.";
    }

    return "Без відповіді.";
  }

  // ---------- ІНІЦІАЛІЗАЦІЯ ----------

  loadArticles();
  renderArticleList();

  if (articles.length > 0) {
    selectArticle(articles[0].id);
  }
});
