document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat');
    const apiKeyContainer = document.getElementById('api-key-container');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const chatInterface = document.getElementById('chat-interface');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    let apiKey = sessionStorage.getItem('openai_api_key');

    // --- Sidebar Logic ---
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // --- Chat Widget Toggle ---
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        checkApiKey();
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    // --- API Key Management ---
    function checkApiKey() {
        if (apiKey) {
            apiKeyContainer.classList.add('hidden');
            chatInterface.classList.remove('hidden');
        } else {
            apiKeyContainer.classList.remove('hidden');
            chatInterface.classList.add('hidden');
        }
    }

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key.startsWith('sk-')) {
            apiKey = key;
            sessionStorage.setItem('openai_api_key', key);
            checkApiKey();
        } else {
            alert('Please enter a valid OpenAI API Key starting with sk-');
        }
    });

    // --- Chat Logic ---
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.innerText = text; // Safe text insertion
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    function getPageContent() {
        // Simple scraper to get the context of the guide
        const content = document.querySelector('.content').innerText;
        return content.substring(0, 10000); // Limit tokens roughly
    }

    async function handleChat() {
        const text = userInput.value.trim();
        if (!text || !apiKey) return;

        // 1. Add User Message
        addMessage(text, 'user');
        userInput.value = '';

        // 2. Add Loading Indicator
        const loadingDiv = addMessage('Thinking', 'bot');
        loadingDiv.classList.add('loading-dots');

        // 3. Prepare System Prompt with Context
        const pageContext = getPageContent();
        const systemPrompt = `You are a helpful documentation assistant. 
        Answer the user's question based strictly on the following content from the guide:
        
        --- START CONTENT ---
        ${pageContext}
        --- END CONTENT ---
        
        If the answer is not in the content, say you don't know.`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ],
                    temperature: 0.5
                })
            });

            const data = await response.json();

            // Remove loading div
            chatMessages.removeChild(loadingDiv);

            if (data.error) {
                addMessage(`Error: ${data.error.message}`, 'bot');
            } else {
                const reply = data.choices[0].message.content;
                addMessage(reply, 'bot');
            }

        } catch (error) {
            chatMessages.removeChild(loadingDiv);
            addMessage(`Network Error: ${error.message}`, 'bot');
        }
    }

    sendBtn.addEventListener('click', handleChat);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });
});
