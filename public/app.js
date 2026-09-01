// Lógica de la app Quinoa: carga el menú, maneja el carrito y arranca el pago con tarjeta.
(function () {
  const CART_KEY = "quinoa_cart_v1";

  const state = {
    menu: null,
    cart: loadCart(), // { [itemId]: qty }
    config: null
  };

  const els = {
    menuRoot: document.getElementById("menu-root"),
    businessName: document.getElementById("business-name"),
    cartButton: document.getElementById("cart-button"),
    cartCount: document.getElementById("cart-count"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartOverlay: document.getElementById("cart-overlay"),
    closeCart: document.getElementById("close-cart"),
    cartItems: document.getElementById("cart-items"),
    cartSubtotal: document.getElementById("cart-subtotal"),
    cartDelivery: document.getElementById("cart-delivery"),
    cartDeliveryLine: document.getElementById("cart-delivery-line"),
    cartTotal: document.getElementById("cart-total"),
    checkoutButton: document.getElementById("checkout-button"),
    checkoutError: document.getElementById("checkout-error"),
    customerForm: document.getElementById("customer-form"),
    addressField: document.getElementById("address-field"),
    paymentsWarning: document.getElementById("payments-warning"),
    offlineBanner: document.getElementById("offline-banner")
  };

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  }

  function money(cents) {
    // "en-CA" da el formato canadiense limpio: $10.50
    return (cents / 100).toLocaleString("en-CA", {
      style: "currency",
      currency: (state.config && state.config.currency || "usd").toUpperCase()
    });
  }

  function findItem(itemId) {
    if (!state.menu) return null;
    for (const cat of state.menu.categories) {
      const found = cat.items.find((i) => i.id === itemId);
      if (found) return found;
    }
    return null;
  }

  function cartCount() {
    return Object.values(state.cart).reduce((a, b) => a + b, 0);
  }

  function cartSubtotal() {
    let total = 0;
    for (const [id, qty] of Object.entries(state.cart)) {
      const item = findItem(id);
      if (item) total += item.price * qty;
    }
    return total;
  }

  // ---------- Render del menú ----------
  function renderMenu() {
    if (!state.menu) return;
    els.businessName.textContent = (state.config && state.config.businessName) || "Quinoa";

    const frag = document.createDocumentFragment();
    for (const cat of state.menu.categories) {
      const section = document.createElement("section");
      section.className = "menu-category";
      const h2 = document.createElement("h2");
      h2.textContent = cat.name;
      section.appendChild(h2);

      for (const item of cat.items) {
        section.appendChild(renderMenuItem(item));
      }
      frag.appendChild(section);
    }
    els.menuRoot.innerHTML = "";
    els.menuRoot.appendChild(frag);
  }

  function renderMenuItem(item) {
    const row = document.createElement("div");
    row.className = "menu-item";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    img.loading = "lazy";
    row.appendChild(img);

    const info = document.createElement("div");
    info.className = "menu-item-info";
    info.innerHTML = `<h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || "")}</p>`;

    const footer = document.createElement("div");
    footer.className = "menu-item-footer";
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = money(item.price);
    footer.appendChild(price);
    footer.appendChild(renderQtyControl(item.id));

    info.appendChild(footer);
    row.appendChild(info);
    return row;
  }

  function renderQtyControl(itemId) {
    const qty = state.cart[itemId] || 0;
    const wrap = document.createElement("div");

    if (qty === 0) {
      const btn = document.createElement("button");
      btn.className = "add-button";
      btn.textContent = "Agregar";
      btn.addEventListener("click", () => changeQty(itemId, 1));
      wrap.appendChild(btn);
      return wrap;
    }

    wrap.className = "qty-control";
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.addEventListener("click", () => changeQty(itemId, -1));

    const count = document.createElement("span");
    count.textContent = qty;

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.addEventListener("click", () => changeQty(itemId, 1));

    wrap.appendChild(minus);
    wrap.appendChild(count);
    wrap.appendChild(plus);
    return wrap;
  }

  function changeQty(itemId, delta) {
    const current = state.cart[itemId] || 0;
    const next = Math.max(0, Math.min(20, current + delta));
    if (next === 0) delete state.cart[itemId];
    else state.cart[itemId] = next;
    saveCart();
    renderMenu();
    renderCart();
  }

  // ---------- Carrito ----------
  function renderCart() {
    els.cartCount.textContent = cartCount();

    const entries = Object.entries(state.cart);
    if (entries.length === 0) {
      els.cartItems.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
    } else {
      els.cartItems.innerHTML = "";
      for (const [id, qty] of entries) {
        const item = findItem(id);
        if (!item) continue;
        const row = document.createElement("div");
        row.className = "cart-item-row";
        row.innerHTML = `<span>${qty} × ${escapeHtml(item.name)}</span><span>${money(item.price * qty)}</span>`;
        els.cartItems.appendChild(row);
      }
    }

    const orderType = els.customerForm.elements["orderType"].value;
    const subtotal = cartSubtotal();
    const delivery = orderType === "delivery" && subtotal > 0 ? 300 : 0;

    els.cartSubtotal.textContent = money(subtotal);
    if (delivery > 0) {
      els.cartDeliveryLine.hidden = false;
      els.cartDelivery.textContent = money(delivery);
    } else {
      els.cartDeliveryLine.hidden = true;
    }
    els.cartTotal.textContent = money(subtotal + delivery);

    const paymentsEnabled = state.config && state.config.paymentsEnabled;
    els.checkoutButton.disabled = subtotal === 0 || !paymentsEnabled;
    els.paymentsWarning.hidden = !!paymentsEnabled;
  }

  function openCart() {
    els.cartDrawer.classList.add("open");
    els.cartDrawer.setAttribute("aria-hidden", "false");
    els.cartOverlay.hidden = false;
  }
  function closeCartFn() {
    els.cartDrawer.classList.remove("open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    els.cartOverlay.hidden = true;
  }

  els.cartButton.addEventListener("click", openCart);
  els.closeCart.addEventListener("click", closeCartFn);
  els.cartOverlay.addEventListener("click", closeCartFn);

  els.customerForm.elements["orderType"].forEach && null; // no-op guard
  document.querySelectorAll('input[name="orderType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      els.addressField.hidden = radio.value !== "delivery" ? true : false;
      // Only toggle based on the checked one:
      const checked = els.customerForm.querySelector('input[name="orderType"]:checked').value;
      els.addressField.hidden = checked !== "delivery";
      els.addressField.querySelector("textarea").required = checked === "delivery";
      renderCart();
    });
  });

  // ---------- Checkout ----------
  els.checkoutButton.addEventListener("click", async () => {
    els.checkoutError.hidden = true;

    if (!els.customerForm.reportValidity()) return;

    const formData = new FormData(els.customerForm);
    const customer = {
      name: formData.get("name").trim(),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      orderType: formData.get("orderType"),
      address: formData.get("address").trim(),
      notes: formData.get("notes").trim()
    };

    const items = Object.entries(state.cart).map(([id, qty]) => ({ id, qty }));
    if (items.length === 0) return;

    els.checkoutButton.disabled = true;
    els.checkoutButton.textContent = "Redirigiendo a pago seguro…";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      // No borramos el carrito todavía: si el usuario cancela el pago,
      // queremos que lo encuentre intacto al volver.
      window.location.href = data.url;
    } catch (err) {
      els.checkoutError.textContent = err.message;
      els.checkoutError.hidden = false;
      els.checkoutButton.disabled = false;
      els.checkoutButton.textContent = "Pagar con tarjeta 💳";
    }
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Carga inicial ----------
  async function init() {
    try {
      const [configRes, menuRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/menu")
      ]);
      state.config = await configRes.json();
      state.menu = await menuRes.json();
      renderMenu();
      renderCart();
    } catch (err) {
      els.menuRoot.innerHTML =
        '<p class="loading">No se pudo cargar el menú. Verifica tu conexión e intenta de nuevo.</p>';
    }
  }

  window.addEventListener("online", () => (els.offlineBanner.hidden = true));
  window.addEventListener("offline", () => (els.offlineBanner.hidden = false));
  if (!navigator.onLine) els.offlineBanner.hidden = false;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }

  init();
})();
