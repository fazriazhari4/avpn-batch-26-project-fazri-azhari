// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const welcomeCard = document.getElementById('welcome-card');

// State management
const conversation = [];
let interactionId = null;

/**
 * Format markdown-like text to basic HTML safely
 * @param {string} text 
 * @returns {string} HTML string
 */
function formatResponseText(text) {
  if (!text) return '';
  
  // Escape HTML tags to prevent XSS
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text: **text**
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text: *text*
  safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert line breaks to paragraphs/br
  const lines = safeText.split('\n');
  let formattedHtml = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        formattedHtml += '<ul>';
        inList = true;
      }
      const listContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
      formattedHtml += `<li>${listContent}</li>`;
    } else {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      if (trimmed.length > 0) {
        formattedHtml += `<p>${trimmed}</p>`;
      }
    }
  });

  if (inList) {
    formattedHtml += '</ul>';
  }

  return formattedHtml || `<p>${safeText}</p>`;
}

/**
 * Appends a message row to the chat box
 * @param {string} sender - 'user' or 'bot'
 * @param {string} rawText - Message text
 * @param {boolean} isTyping - whether this is typing state
 * @returns {HTMLElement} The created message content element
 */
function appendMessage(sender, rawText, isTyping = false) {
  // Hide welcome card if visible
  if (welcomeCard && welcomeCard.style.display !== 'none') {
    welcomeCard.style.display = 'none';
  }

  const row = document.createElement('div');
  row.classList.add('message-row', sender);

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  if (sender === 'user') {
    avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
  } else {
    avatar.innerHTML = '🥗';
  }

  const content = document.createElement('div');
  content.classList.add('message-content');

  if (isTyping) {
    content.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  } else {
    if (sender === 'bot') {
      content.innerHTML = formatResponseText(rawText);
    } else {
      content.textContent = rawText;
    }
  }

  row.appendChild(avatar);
  row.appendChild(content);
  chatBox.appendChild(row);

  chatBox.scrollTop = chatBox.scrollHeight;
  return content;
}

/**
 * Sends prompt text to backend API
 * @param {string} text 
 */
async function sendMessage(text) {
  if (!text || !text.trim()) return;

  // Clear & disable input field
  userInput.value = '';
  userInput.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  const userText = text.trim();

  // 1. Add user's message to chat box and conversation history
  appendMessage('user', userText);
  conversation.push({ type: 'text', text: userText });

  // 2. Show typing indicator
  const botContentElement = appendMessage('bot', '', true);

  try {
    const payload = {
      conversation: conversation
    };

    if (interactionId) {
      payload.interactionId = interactionId;
    }

    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server error (${response.status})`);
    }

    const data = await response.json();

    if (data && data.result) {
      // Replace typing indicator with formatted result
      botContentElement.innerHTML = formatResponseText(data.result);
      conversation.push({ type: 'text', text: data.result });

      if (data.interactionId) {
        interactionId = data.interactionId;
      }
    } else {
      botContentElement.innerHTML = '<p>Maaf, tidak ada respons yang diterima dari server.</p>';
      conversation.pop();
    }
  } catch (error) {
    console.error('Error requesting chat completion:', error);
    botContentElement.innerHTML = '<p>Gagal terhubung ke server. Silakan coba lagi nanti.</p>';
    conversation.pop();
  } finally {
    userInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Handle Form Submit
chatForm.addEventListener('submit', function (e) {
  e.preventDefault();
  sendMessage(userInput.value);
});

// Handle Suggestion & Quick Tag Click
document.addEventListener('click', function (e) {
  const target = e.target.closest('[data-prompt]');
  if (target) {
    const promptText = target.getAttribute('data-prompt');
    if (promptText) {
      sendMessage(promptText);
    }
  }
});
