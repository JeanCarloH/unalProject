import productos from "./data.js";

let filteredProducts = [...productos];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentTheme = localStorage.getItem("theme") || "light";

// Elementos del DOM
const productsGrid = document.getElementById("productsGrid");
const categoryFilter = document.getElementById("categoryFilter");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const clearFiltersBtn = document.getElementById("clearFilters");
const productsCount = document.getElementById("productsCount");
const cartIcon = document.getElementById("cartIcon");
const cartCount = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const themeToggle = document.getElementById("themeToggle");

// Inicialización
function init() {
  loadTheme();
  populateCategories();
  renderProducts();
  updateCartUI();
  setupEventListeners();
}

// Configurar tema
function loadTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  const icon = themeToggle.querySelector("i");
  icon.className = currentTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
  loadTheme();
}

// Poblar filtro de categorías
function populateCategories() {
  const categories = [...new Set(productos.map((p) => p.category))];
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Renderizar productos
function renderProducts() {
  productsGrid.innerHTML = "";

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
        <div class="no-products">
            <i class="fas fa-search"></i>
            <p>No se encontraron productos</p>
        </div>
    `;
    productsCount.textContent = "0 productos";
    return;
  }

  filteredProducts.forEach((product, index) => {
    console.log(`Renderizando producto: ${product.image}`);
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.style.animationDelay = `${index * 0.1}s`;

    productCard.innerHTML = `
        <div class="product-image">
           <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price}</div>
            <button class="add-to-cart">
                <i class="fas fa-cart-plus"></i>
                Agregar al carrito
            </button>
        </div>
    `;

    // Asignar el evento de clic al botón de "Agregar al carrito"
    const addToCartBtn = productCard.querySelector(".add-to-cart");
    addToCartBtn.addEventListener("click", () => addToCart(product.id));

    productsGrid.appendChild(productCard);
  });

  productsCount.textContent = `${filteredProducts.length} producto${filteredProducts.length !== 1 ? "s" : ""}`;
}

// Filtrar productos
function filterProducts() {
  const category = categoryFilter.value;
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

  filteredProducts = productos.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchesCategory && matchesPrice;
  });

  renderProducts();
}

// Limpiar filtros
function clearFilters() {
  categoryFilter.value = "";
  minPriceInput.value = "";
  maxPriceInput.value = "";
  filteredProducts = [...productos];
  renderProducts();
}

// Carrito de compras
function addToCart(productId) {
  const product = productos.find((p) => p.id === productId);
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showCartNotification();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartUI();
  renderCart();
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  const item = cart.find((item) => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
    renderCart();
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? "flex" : "none";
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>Tu carrito está vacío</p>
        </div>
    `;
    cartTotal.textContent = "Total: $0";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="remove-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `
    )
    .join("");

  // Asignar eventos de clic a los botones de cantidad
  const decreaseButtons = document.querySelectorAll(".quantity-btn.decrease");
  const increaseButtons = document.querySelectorAll(".quantity-btn.increase");

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = parseInt(e.target.closest(".quantity-btn").getAttribute("data-id"));
      updateQuantity(productId, cart.find((item) => item.id === productId).quantity - 1);
    });
  });

  increaseButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = parseInt(e.target.closest(".quantity-btn").getAttribute("data-id"));
      updateQuantity(productId, cart.find((item) => item.id === productId).quantity + 1);
    });
  });

  // 👇 Aquí va el bloque que agrega el evento a los botones de eliminar
  const removeButtons = document.querySelectorAll(".remove-item");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = parseInt(e.currentTarget.getAttribute("data-id"));
      removeFromCart(id);
    });
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

function showCartNotification() {
  // Crear notificación temporal
  const notification = document.createElement("div");
  notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--gradient);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 3000;
                animation: slideInRight 0.3s ease;
            `;
  notification.innerHTML = `
                <i class="fas fa-check"></i>
                Producto agregado al carrito
            `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event Listeners
function setupEventListeners() {
  // Filtros
  categoryFilter.addEventListener("change", filterProducts);
  minPriceInput.addEventListener("input", filterProducts);
  maxPriceInput.addEventListener("input", filterProducts);
  clearFiltersBtn.addEventListener("click", clearFilters);

  // Carrito
  cartIcon.addEventListener("click", () => {
    cartModal.classList.add("active");
    renderCart();
  });

  closeCart.addEventListener("click", () => {
    cartModal.classList.remove("active");
  });

  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) {
      cartModal.classList.remove("active");
    }
  });

  // Tema
  themeToggle.addEventListener("click", toggleTheme);

  // Cerrar modal con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartModal.classList.contains("active")) {
      cartModal.classList.remove("active");
    }
  });
}

// Animaciones CSS adicionales
const style = document.createElement("style");
style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .product-card:hover .add-to-cart {
                background: linear-gradient(135deg, var(--primary-dark), var(--accent-color));
            }

            .cart-count {
                animation: bounce 0.3s ease;
            }

            @keyframes bounce {
                0%, 20%, 60%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                80% {
                    transform: translateY(-5px);
                }
            }
        `;
document.head.appendChild(style);

// Inicializar aplicación
init();
