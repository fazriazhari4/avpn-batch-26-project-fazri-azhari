// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const welcomeCard = document.getElementById('welcome-card');

// Image upload DOM Elements
const uploadBtn = document.getElementById('upload-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const previewFilename = document.getElementById('preview-filename');
const removeImageBtn = document.getElementById('remove-image-btn');

// State management
const conversation = [];
let interactionId = null;
let selectedFile = null;
let selectedFileBase64 = null;

// Image upload event listeners
if (uploadBtn && imageInput) {
  uploadBtn.addEventListener('click', () => {
    imageInput.click();
  });

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Harap pilih file gambar (JPG, PNG, WEBP, dll.)');
        imageInput.value = '';
        return;
      }
      selectedFile = file;
      if (previewFilename) previewFilename.textContent = file.name;

      const reader = new FileReader();
      reader.onload = function(evt) {
        selectedFileBase64 = evt.target.result;
        if (imagePreview) imagePreview.src = selectedFileBase64;
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (removeImageBtn) {
  removeImageBtn.addEventListener('click', () => {
    clearSelectedImage();
  });
}

function clearSelectedImage() {
  selectedFile = null;
  selectedFileBase64 = null;
  if (imageInput) imageInput.value = '';
  if (imagePreview) imagePreview.src = '';
  if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
}

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
 * @param {string|null} imageSrc - Base64 or URL of attached image
 * @returns {HTMLElement} The created message content element
 */
function appendMessage(sender, rawText, isTyping = false, imageSrc = null) {
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
    if (imageSrc) {
      const imgElem = document.createElement('img');
      imgElem.src = imageSrc;
      imgElem.alt = 'Foto Makanan';
      imgElem.classList.add('chat-image');
      content.appendChild(imgElem);
    }
    if (sender === 'bot') {
      const textDiv = document.createElement('div');
      textDiv.innerHTML = formatResponseText(rawText);
      content.appendChild(textDiv);
    } else {
      if (rawText) {
        const textElem = document.createElement('p');
        textElem.textContent = rawText;
        content.appendChild(textElem);
      }
    }
  }

  row.appendChild(avatar);
  row.appendChild(content);
  chatBox.appendChild(row);

  chatBox.scrollTop = chatBox.scrollHeight;
  return content;
}

/**
 * Sends prompt text and optional image to backend API
 * @param {string} text 
 */
async function sendMessage(text) {
  if ((!text || !text.trim()) && !selectedFile) return;

  const userText = text ? text.trim() : '';
  const currentImageFile = selectedFile;
  const currentImageBase64 = selectedFileBase64;

  // Clear input & image selection
  userInput.value = '';
  clearSelectedImage();
  
  userInput.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
  if (uploadBtn) uploadBtn.disabled = true;

  // 1. Add user's message to UI and conversation array
  appendMessage('user', userText, false, currentImageBase64);

  // If text prompt was provided or default prompt for image-only submission
  const finalPromptText = userText || (currentImageFile ? 'Tolong analisis foto makanan ini dan berikan estimasi kalori serta informasinya.' : '');
  
  if (finalPromptText) {
    conversation.push({ type: 'text', text: finalPromptText });
  }

  if (currentImageBase64 && currentImageFile) {
    const base64Data = currentImageBase64.split(',')[1];
    conversation.push({
      type: 'image',
      data: base64Data,
      mime_type: currentImageFile.type
    });
  }

  // 2. Show typing indicator
  const botContentElement = appendMessage('bot', '', true);

  try {
    const formData = new FormData();
    formData.append('conversation', JSON.stringify(conversation));
    if (interactionId) {
      formData.append('interactionId', interactionId);
    }
    if (currentImageFile) {
      formData.append('image', currentImageFile);
    }

    const response = await fetch('/chat', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server error (${response.status})`);
    }

    const data = await response.json();

    if (data && data.result) {
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
    if (uploadBtn) uploadBtn.disabled = false;
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
  const uploadAction = e.target.closest('[data-action="trigger-upload"]');
  if (uploadAction) {
    if (imageInput) imageInput.click();
    return;
  }

  const target = e.target.closest('[data-prompt]');
  if (target) {
    const promptText = target.getAttribute('data-prompt');
    if (promptText) {
      sendMessage(promptText);
    }
  }
});
