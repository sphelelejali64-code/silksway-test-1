function openModal(src) {
  alert("Open modal to show image: " + src);
  // You can implement an actual image modal popup here if needed
}

const CART_STORAGE_KEY = 'silkswayCart';
let cartState = { items: [] };

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cartState.items = raw ? JSON.parse(raw) : [];
  } catch (e) {
    cartState.items = [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState.items));
  } catch (e) {
    // ignore
  }
}

function formatCurrency(n) {
  if (isNaN(n)) return 'R0';
  return `R${Number(n).toFixed(0)}`;
}

function addToCart(itemName, itemPrice) {
  loadCartFromStorage();
  const price = Number(itemPrice) || 0;
  const existingItem = cartState.items.find((i) => i.name === itemName);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartState.items.push({ name: itemName, price, quantity: 1 });
  }
  saveCartToStorage();
  updateCartUI();
}

function refreshAddCartBadges() {
  loadCartFromStorage();
  document.querySelectorAll('.card').forEach((card) => {
    const title = card.querySelector('h3')?.textContent.trim();
    const addButton = card.querySelector('.add-cart');
    if (!title || !addButton) return;

    const cartItem = cartState.items.find((item) => item.name === title);
    if (cartItem && cartItem.quantity > 0) {
      addButton.innerHTML = `Add to Cart <span class="add-cart-count">(${cartItem.quantity})</span>`;
    } else {
      addButton.textContent = 'Add to Cart';
    }
  });
}

function updateCartUI() {
  loadCartFromStorage();
  const count = cartState.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const navCount = document.getElementById('cartNavCount');
  if (navCount) navCount.textContent = String(count);

  refreshAddCartBadges();

  const checkoutContent = document.getElementById('checkoutContent');
  if (checkoutContent) {
    buildCartSummary();
  }
}

function setNavCartCount() {
  loadCartFromStorage();
  const count = cartState.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const navCount = document.getElementById('cartNavCount');
  if (navCount) navCount.textContent = String(count);
}

function updatePayButtons() {
  document.querySelectorAll('.btn.pay').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // default behavior: go to bank page
      window.location.href = 'bank.html';
    });
  });
}

const CHAT_STORAGE_KEY = 'silkswayChatHistory';
let chatState = { chatHistory: [] };

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveChatHistory(history) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    // ignore
  }
}

function renderChatHistory() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  chatMessages.innerHTML = '';
  if (!Array.isArray(chatState.chatHistory) || chatState.chatHistory.length === 0) {
    chatState.chatHistory = [{ sender: 'assistant', text: 'Hello! I’m your assistant. Ask about products, orders, or payment.' }];
    saveChatHistory(chatState.chatHistory);
  }
  chatState.chatHistory.forEach((entry) => {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-bubble ${entry.sender}`;
    messageEl.textContent = entry.text;
    chatMessages.appendChild(messageEl);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendChatMessage(sender, text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const messageEl = document.createElement('div');
  messageEl.className = `chat-bubble ${sender}`;
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (!Array.isArray(chatState.chatHistory)) chatState.chatHistory = [];
  chatState.chatHistory.push({ sender, text });
  saveChatHistory(chatState.chatHistory);
}

function removeFromCart(itemName) {
  loadCartFromStorage();
  cartState.items = cartState.items.filter((item) => item.name !== itemName);
  saveCartToStorage();
  updateCartUI();
}

function clearCart() {
  cartState.items = [];
  saveCartToStorage();
  updateCartUI();
}

function showPaymentInfo(item, price) {
  document.getElementById("paymentText").innerText = "Pay for " + item + " - R" + price;
  document.getElementById("paymentModal").classList.remove("hidden");
  document.getElementById("paymentModal").classList.add("show");
}

function closePaymentInfo() {
  document.getElementById("paymentModal").classList.add("hidden");
  document.getElementById("paymentModal").classList.remove("show");
}

function changeMainImage(mainImageId, src) {
  const mainImage = document.getElementById(mainImageId);
  mainImage.src = src;
}


function scrollCarousel(carouselId, scrollAmount) {
  const container = document.getElementById(carouselId);
  container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}




function getAssistantReply(message) {
  const normalized = message.toLowerCase();
  const context = getCurrentPageContext();
  const visibleProduct = findMatchingProduct(message, context.products);
  const productName = visibleProduct?.name || context.product;
  const productPrice = visibleProduct?.price || context.price;
  const productDescription = visibleProduct?.description || '';
  

  if (/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/.test(normalized)) {
    return 'Hello! I’m your assistant. Ask me about products, prices, payment, or how to place an order.';
  }

  if (/\b(this page|current page|page)\b/.test(normalized)) {
    return `You are on the ${context.pageName}. ${context.instruction}`;
  }

  if (productName && /\b(details|information|info|tell me about|describe|about)\b/.test(normalized)) {
    const pricePart = productPrice ? ` It is listed at R${productPrice}.` : '';
    const descriptionPart = productDescription ? ` ${productDescription}` : '';
    return `This page includes ${productName}.${pricePart}${descriptionPart} You can click the inquiry button or continue to payment if you are ready.`;
  }

  if (productName && /\b(price|cost|amount|how much|quote)\b/.test(normalized)) {
    return productPrice
      ? `The ${productName} is priced at R${productPrice}. Use the inquiry button or go to checkout to proceed.`
      : `I see ${productName} on this page, but the price is not listed exactly here. Use the inquiry button to ask for the current price.`;
  }

  if (/\b(what products|which products|show.*products|list.*products|products on this page)\b/.test(normalized)) {
    return summarizeProducts(context.products);
  }

  if (productName && /\b(inquiry|order|buy|purchase|send|want to order|want to buy)\b/.test(normalized)) {
    return `For ${productName}, use the inquiry button or form on this page. I can also tell you how to complete payment once you're ready.`;
  }

  if (context.page === 'bank.html' && /\b(payment|pay|bank|eft|transfer|payfast|account)\b/.test(normalized)) {
    return 'This is the Bank page. You can pay using the bank transfer or EFT details shown here, then send us a WhatsApp message to confirm your order.';
  }

  if (context.page === 'checkout.html' && /\b(cart|checkout|order|items|purchase|review)\b/.test(normalized)) {
    return 'This is the Checkout page. Review the items in your cart, confirm the total, and then proceed to the payment page to complete your order.';
  }

  if (context.page === 'women.html' && /\b(women|female|her|collection|dress|skirt|outfit|style)\b/.test(normalized)) {
    return 'You are on the Women’s Collection page. I can help you choose pieces from this collection and explain how to inquire or order any item.';
  }

  if (context.page === 'inquiry.html' && /\b(inquiry|ask|submit|question|request)\b/.test(normalized)) {
    return 'This is the Inquiry page. Fill in the form to ask about products, pricing, or availability, and I’ll help you from here.';
  }

  if (context.page === 'index.html' && /\b(clothing|electronics|shop|product|featured|galaxy|women)\b/.test(normalized)) {
    return `This homepage shows a mix of clothing and electronics. Use the inquiry buttons for any product, or ask me about specific items on this page.`;
  }

  if (/\b(price|cost|amount|quote)\b/.test(normalized)) {
    if (productName) {
      return productPrice
        ? `The ${productName} is listed at R${productPrice}.`
        : `I see ${productName} on this page, but I don’t have the exact price here. Use the inquiry button for the latest details.`;
    }
    return `I can help with pricing. Tell me which product you want or use the inquiry button for the item shown on this page.`;
  }

  if (/\b(order|buy|purchase|inquiry|ask)\b/.test(normalized)) {
    if (productName) {
      return `Use the inquiry button for ${productName}. I can also walk you through checkout and bank payment if you want to complete the order.`;
    }
    return `${context.instruction} If you’re ready to order, use the on-page inquiry or payment buttons and I’ll guide you.`;
  }

  if (/\b(delivery|shipping|ship|post)\b/.test(normalized)) {
    return 'Delivery depends on your location. We can arrange local delivery, collection, or send you order details via WhatsApp after inquiry.';
  }

  if (/\b(payment|pay|bank|eft|payfast)\b/.test(normalized)) {
    return context.page === 'bank.html'
      ? 'On the Bank page, follow the payment details there and then confirm your order using WhatsApp.'
      : 'If you are on the Bank page, follow the payment details shown there. Otherwise, I can direct you to the payment section from this page.';
  }

  if (/\b(contact|whatsapp|phone|email)\b/.test(normalized)) {
    return 'Call 072 628 2500 or email gumede.njabulo1997@gmail.com. I’m also available here for help while you shop.';
  }

  if (context.products.length > 0) {
    return `I’m here to help on the ${context.pageName}. ${summarizeProducts(context.products)} Ask me about any product shown here.`;
  }

  return `I’m here to help on the ${context.pageName}. Ask me about ${context.focus} or how to make an inquiry.`;
}



function toggleChatPanel(isOpen) {
  const panel = document.querySelector('.chat-panel');
  if (!panel) return;
  panel.classList.toggle('hidden', !isOpen);
}

function submitChatMessage(event) {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  appendChatMessage('user', message);
  input.value = '';

  setTimeout(() => {
    appendChatMessage('assistant', getAssistantReply(message));
  }, 300);
}

function initChatWidget() {
  chatState.chatHistory = loadChatHistory();
  renderChatHistory();
  document.querySelector('.chat-toggle-btn')?.addEventListener('click', () => toggleChatPanel(true));
  document.querySelector('.chat-close-btn')?.addEventListener('click', () => toggleChatPanel(false));
  document.getElementById('chatForm')?.addEventListener('submit', submitChatMessage);
}

function getVisiblePageProducts() {
  const products = [];
  const seen = new Set();

  const collect = (titleEl, priceEl, descEl) => {
    if (!titleEl) return;
    const name = titleEl.textContent.trim();
    if (!name || seen.has(name)) return;
    seen.add(name);

    const price = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, '').trim() : '';
    const description = descEl ? descEl.textContent.trim() : '';
    products.push({ name, price: price || null, description });
  };

  document.querySelectorAll('.card').forEach((card) => {
    const titleEl = card.querySelector('h3');
    const priceEl = card.querySelector('.price');
    const descEl = card.querySelector('p:not(.price)');
    collect(titleEl, priceEl, descEl);
  });

  document.querySelectorAll('.carousel-content').forEach((card) => {
    const titleEl = card.querySelector('h3');
    const priceEl = card.querySelector('.price');
    const descEl = card.querySelector('p');
    collect(titleEl, priceEl, descEl);
  });

  return products;
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function findMatchingProduct(message, products) {
  const normalizedMessage = normalizeText(message);
  return products.find((product) => normalizedMessage.includes(normalizeText(product.name)));
}

function summarizeProducts(products) {
  if (products.length === 0) {
    return 'There are no product details visible on this page right now.';
  }
  const names = products.slice(0, 4).map((product) => product.name);
  if (products.length <= 4) {
    return `The visible products include ${names.join(', ')}.`;
  }
  return `The visible products include ${names.join(', ')}, and more.`;
}

function getCurrentPageContext() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const params = new URLSearchParams(window.location.search);
  const product = params.get('product');
  const price = params.get('price');
  const products = getVisiblePageProducts();

  const pageContext = {
    'index.html': {
      pageName: 'Homepage',
      focus: 'clothing and electronics, featured products, and inquiry options',
      instruction: 'Browse products and click any inquiry button to ask about a specific item.',
    },
    'women.html': {
      pageName: "Women's Collection",
      focus: 'women’s streetwear, stylish outfits, and curated pieces',
      instruction: 'This page highlights the women’s collection. Ask me which item fits best.',
    },
    'checkout.html': {
      pageName: 'Checkout',
      focus: 'your cart, order review, and payment flow',
      instruction: 'Use this page to review items in your cart and complete your purchase.',
    },
    'bank.html': {
      pageName: 'Bank Payment',
      focus: 'payment instructions, EFT, and bank transfer details',
      instruction: 'This page gives you the payment information and how to pay for your order.',
    },
    'inquiry.html': {
      pageName: 'Inquiry',
      focus: 'submitting product inquiries and order requests',
      instruction: 'Use the inquiry form on this page to ask about products, prices, or availability.',
    },
  };

  return {
    ...(pageContext[page] || {
      pageName: 'Store Page',
      focus: 'store products and ordering',
      instruction: 'Ask me anything about the current page or the products shown here.',
    }),
    page,
    product,
    price,
    products,
  };
}

function addCartButtons() {
  document.querySelectorAll('.card').forEach((card) => {
    const title = card.querySelector('h3')?.textContent.trim();
    const priceText = card.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '').trim();
    const price = priceText ? parseFloat(priceText) : NaN;
    const actions = card.querySelector('.card-actions');
    if (!title || isNaN(price) || !actions || actions.querySelector('.add-cart')) {
      return;
    }

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn secondary small add-cart';
    addButton.textContent = 'Add to Cart';
    addButton.addEventListener('click', () => addToCart(title, price));
    actions.insertBefore(addButton, actions.querySelector('.btn.pay') || null);
  });
}

function buildCartSummary() {
  const checkoutContent = document.getElementById('checkoutContent');
  if (!checkoutContent) {
    return;
  }

  const itemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (itemCount === 0) {
    checkoutContent.innerHTML = `
      <div class="cart-summary-empty">
        <p>Your cart is empty.</p>
        <a class="btn primary" href="index.html">Continue Shopping</a>
      </div>
    `;
    return;
  }

  const itemsHtml = cartState.items
    .map(
      (item) => `
        <li class="cart-item-row">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-meta">${item.quantity} x ${formatCurrency(item.price)}</span>
          <span class="cart-item-total">${formatCurrency(item.price * item.quantity)}</span>
          <button type="button" class="btn tertiary small remove-item-btn" data-name="${item.name}">Remove</button>
        </li>
      `
    )
    .join('');

  checkoutContent.innerHTML = `
    <div class="cart-summary-grid">
      <div class="cart-summary-stats">
        <p class="cart-metric"><strong id="cartCount">${itemCount} item${itemCount === 1 ? '' : 's'}</strong></p>
        <p class="cart-metric" id="cartTotal">Total: ${formatCurrency(totalPrice)}</p>
      </div>
      <div class="cart-summary-list">
        <h3>Your items</h3>
        <ul id="cartItemsList" class="cart-items-list">${itemsHtml}</ul>
        <div class="cart-summary-actions">
          <button type="button" class="btn secondary small" id="clearCartBtn">Clear Cart</button>
          <a class="btn primary small" href="bank.html">Proceed to Payment</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
  document.querySelectorAll('.remove-item-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const itemName = button.getAttribute('data-name');
      if (itemName) {
        removeFromCart(itemName);
      }
    });
  });
}

// Auto-rotating Header Background
const headerImages = [
  'img/aa.jpg',
  'img/wa.webp',
  'img/cc.jpg',
  'img/tt.jpg',
  'img/sp.webp',
  'img/blu.webp'
];

let currentHeaderImageIndex = 0;

function rotateHeaderImage() {
  const heroElement = document.querySelector('header.hero');
  if (heroElement) {
    const imagePath = headerImages[currentHeaderImageIndex];
    heroElement.style.backgroundImage = `linear-gradient(135deg, rgba(30, 60, 114, 0.7), rgba(42, 82, 152, 0.7)), url('${imagePath}')`;
    heroElement.style.backgroundSize = 'cover';
    heroElement.style.backgroundPosition = 'center';
    heroElement.style.backgroundAttachment = 'fixed';
    
    currentHeaderImageIndex = (currentHeaderImageIndex + 1) % headerImages.length;
  }
}

// Initialize header image and start rotation
document.addEventListener('DOMContentLoaded', () => {
  rotateHeaderImage();
  setInterval(rotateHeaderImage, 5000); // Change image every 5 seconds

  // Featured Carousel
  let currentCarouselIndex = 0;
  const totalProducts = 13;

  function showCarouselProduct(index) {
    const allCarouselContents = document.querySelectorAll('.carousel-container .carousel-content');
    allCarouselContents.forEach(content => {
      content.style.display = 'none';
    });
    
    const currentContent = document.querySelector(`.carousel-content[data-index="${index}"]`);
    if (currentContent) {
      currentContent.style.display = 'block';
    }
  }

  showCarouselProduct(currentCarouselIndex);
  
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentCarouselIndex = (currentCarouselIndex - 1 + totalProducts) % totalProducts;
      showCarouselProduct(currentCarouselIndex);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentCarouselIndex = (currentCarouselIndex + 1) % totalProducts;
      showCarouselProduct(currentCarouselIndex);
    });
  }

  // Hamburger Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });

  setNavCartCount();
  buildCartSummary();
  addCartButtons();
  updatePayButtons();
  initChatWidget();
});

let isZoomed = false;

// Only add zoom functionality if mainImage exists
const mainImage = document.getElementById('mainImage1');
if (mainImage) {
  mainImage.addEventListener('click', () => {
    if (!isZoomed) {
      mainImage.style.transform = 'scale(2)';
      mainImage.style.cursor = 'zoom-out';
      isZoomed = true;
    } else {
      mainImage.style.transform = 'scale(1)';
      mainImage.style.cursor = 'zoom-in';
      isZoomed = false;
    }
  });

  const imageContainer = document.querySelector('.image-container');
  if (imageContainer) {
    imageContainer.addEventListener('mouseover', () => {
      mainImage.style.cursor = isZoomed ? 'zoom-out' : 'zoom-in';
    });
  }
}


function setMainImageOnHover(mainImageId, imageSource) {
    // Get the main image container
    const mainImage = document.getElementById(mainImageId);

    // Check if the main image container exists
    if (mainImage) {
        // Set the main image source
        mainImage.src = imageSource;
    }
}




// Get elements
const kiddiesBtn = document.getElementById('kiddies-btn');
const kiddiesSection = document.getElementById('kiddies-section');
const continueBtn = document.getElementById('continue-btn');

// Show kiddies section on main button click
kiddiesBtn.addEventListener('click', () => {
    kiddiesSection.style.display = 'block';
});

// Optional: You can make the continue button do something further
continueBtn.addEventListener('click', () => {
    alert("Keep having fun in the kiddies section!");
    // Or you can add navigation or other actions here
});



























 
