let chatCount = 1;
const historyList = document.getElementById("history-list");
const themeToggle = document.getElementById("theme-toggle");
const themeMenu = document.getElementById("theme-menu");
const themeOptions = document.querySelectorAll(".theme-option");

function applyTheme(theme) {
    document.body.classList.remove("theme-dark", "theme-green", "theme-purple");
    if (theme !== "default") {
        document.body.classList.add(`theme-${theme}`);
    }
}

function toggleThemeMenu() {
    themeMenu.classList.toggle("open");
}

function createHistoryItem(title) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.dataset.messages = "";
    item.innerHTML = `
        <span class="history-title">${title}</span>
        <div class="history-actions">
            <button class="rename-btn">Rename</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
    return item;
}

function addHistoryItem(title) {
    const item = createHistoryItem(title);
    historyList.appendChild(item);
    return item;
}

function renderMessages(messages) {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = messages;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function selectHistoryItem(item) {
    document.querySelectorAll('.history-item').forEach(chatItem => chatItem.classList.remove('active'));
    item.classList.add('active');

    const savedMessages = item.dataset.messages || "";
    if (savedMessages) {
        renderMessages(savedMessages);
    } else {
        renderMessages(`
            <div class="bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <div class="message-label">Chitti</div>
                    <span>New chat started. What would you like to ask?</span>
                </div>
            </div>
        `);
    }
}

function startNewChat() {
    chatCount += 1;
    const newItem = addHistoryItem(`New chat ${chatCount}`);
    selectHistoryItem(newItem);
    document.getElementById("message").value = "";
}

async function sendMessage() {
    const input = document.getElementById("message");
    const message = input.value.trim();

    if (message === "") return;

    const activeItem = document.querySelector('.history-item.active');
    const chatBox = document.getElementById("chat-box");

    chatBox.innerHTML += `
        <div class="user-message">
            <div class="message-bubble">
                <span>${message}</span>
            </div>
        </div>
    `;

    if (activeItem) {
        activeItem.dataset.messages = chatBox.innerHTML;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
    input.value = "";

    const typingIndicator = document.createElement("div");
    typingIndicator.className = "bot-message";
    typingIndicator.id = "typing-indicator";
    typingIndicator.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble">
            <span class="typing">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </div>
    `;
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        document.getElementById("typing-indicator")?.remove();

        chatBox.innerHTML += `
            <div class="bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <div class="message-label">Chitti</div>
                    <span>${data.reply}</span>
                </div>
            </div>
        `;

        if (activeItem) {
            activeItem.dataset.messages = chatBox.innerHTML;
        }
    } catch (error) {
        document.getElementById("typing-indicator")?.remove();
        chatBox.innerHTML += `
            <div class="bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <div class="message-label">Chitti</div>
                    <span>Sorry, something went wrong. Please try again.</span>
                </div>
            </div>
        `;

        if (activeItem) {
            activeItem.dataset.messages = chatBox.innerHTML;
        }
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("message").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

themeToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleThemeMenu();
});

document.addEventListener('click', () => {
    themeMenu.classList.remove('open');
});

themeOptions.forEach(option => {
    option.addEventListener('click', (event) => {
        event.stopPropagation();
        applyTheme(option.dataset.theme);
        themeMenu.classList.remove('open');
    });
});

historyList.addEventListener('click', (event) => {
    const item = event.target.closest('.history-item');
    if (!item) return;

    if (event.target.classList.contains('rename-btn')) {
        event.stopPropagation();
        const title = item.querySelector('.history-title');
        const currentName = title.textContent;
        const newName = prompt('Rename chat', currentName);
        if (newName && newName.trim()) {
            title.textContent = newName.trim();
        }
        return;
    }

    if (event.target.classList.contains('delete-btn')) {
        event.stopPropagation();
        item.remove();

        const remainingItems = document.querySelectorAll('.history-item');
        if (remainingItems.length > 0) {
            selectHistoryItem(remainingItems[0]);
        } else {
            renderMessages(`
                <div class="bot-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-bubble">
                        <div class="message-label">Chitti</div>
                        <span>New chat started. What would you like to ask?</span>
                    </div>
                </div>
            `);
        }
        return;
    }

    selectHistoryItem(item);
});