// Lógica de la app Quinoa: idioma, menú, carrito y pago con tarjeta.
// Quinoa app logic: language, menu, cart and card payment.
(function () {
  const CART_KEY = "quinoa_cart_v1";
  const L = window.QuinoaLang;

  const state = {
    menu: null,
    config: null,
    lang: L.current(),
    cart: loadCart() // { [itemId]: qty }
  };

  const els = {
    menuRoot: document.getElementById("menu-root"),
    businessName: document.getElementById("business-name"),
    langTabs: document.querySelectorAll(".lang-tab"),
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

  const t = (key) => L.t(key, state.lang);
  const field = (value) => L.field(value, state.lang);

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch {
      /* si el navegador bloquea el guardado, el carrito dura solo esta visita */
    }
  }

  // El formato canadiense ($10.50) se usa en los dos idiomas: es el que
  // reconocen los clientes en Canadá y evita textos como "CAD 10.50".
  function money(cents) {
    const currency = ((state.config && state.config.currency) || "cad").toUpperCase();
    return (cents / 100).toLocaleString("en-CA", { style: "currency", currency });
  }

  // ---------- Idioma / Language ----------
  function applyTranslations() {
    document.documentElement.lang = state.lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      el.setAttribute("content", t(el.getAttribute("data-i18n-content")));
    });

    els.langTabs.forEach((tab) => {
      const selected = tab.getAttribute("data-lang") === state.lang;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.classList.toggle("active", selected);
    });
  }

  function setLanguage(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    L.set(lang);
    applyTranslations();
    renderMenu();
    renderCart();
  }

  els.langTabs.forEach((tab) => {
    tab.addEventListener("click", () => setLanguage(tab.getAttribute("data-lang")));
  });

  // ---------- Menú / Menu ----------
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

  function renderMenu() {
    if (!state.menu) return;
    els.businessName.textContent = (state.config && state.config.businessName) || "Quinoa";

    const frag = document.createDocumentFragment();
    for (const cat of state.menu.categories) {
      const section = document.createElement("section");
      section.className = "menu-category";
      const h2 = document.createElement("h2");
      h2.textContent = field(cat.name);
      section.appendChild(h2);
      for (const item of cat.items) section.appendChild(renderMenuItem(item));
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
    img.alt = field(item.name);
    img.loading = "lazy";
    row.appendChild(img);

    const info = document.createElement("div");
    info.className = "menu-item-info";

    const h3 = document.createElement("h3");
    h3.textContent = field(item.name);
    const p = document.createElement("p");
    p.textContent = field(item.description);
    info.appendChild(h3);
    info.appendChild(p);

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
      btn.textContent = t("menu.add");
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

  // ---------- Carrito / Cart ----------
  function renderCart() {
    els.cartCount.textContent = cartCount();

    const entries = Object.entries(state.cart);
    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = t("cart.empty");
      els.cartItems.innerHTML = "";
      els.cartItems.appendChild(empty);
    } else {
      els.cartItems.innerHTML = "";
      for (const [id, qty] of entries) {
        const item = findItem(id);
        if (!item) continue;
        const row = document.createElement("div");
        row.className = "cart-item-row";
        const left = document.createElement("span");
        left.textContent = `${qty} × ${field(item.name)}`;
        const right = document.createElement("span");
        right.textContent = money(item.price * qty);
        row.appendChild(left);
        row.appendChild(right);
        els.cartItems.appendChild(row);
      }
    }

    const orderType = els.customerForm.querySelector('input[name="orderType"]:checked').value;
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
  function closeCart() {
    els.cartDrawer.classList.remove("open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    els.cartOverlay.hidden = true;
  }

  els.cartButton.addEventListener("click", openCart);
  els.closeCart.addEventListener("click", closeCart);
  els.cartOverlay.addEventListener("click", closeCart);

  document.querySelectorAll('input[name="orderType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const checked = els.customerForm.querySelector('input[name="orderType"]:checked').value;
      const isDelivery = checked === "delivery";
      els.addressField.hidden = !isDelivery;
      els.addressField.querySelector("textarea").required = isDelivery;
      renderCart();
    });
  });

  // ---------- Pago / Checkout ----------
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
    els.checkoutButton.textContent = t("checkout.redirecting");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer, lang: state.lang })
      });
      const data = await res.json();
      if (!res.ok) {
        // El servidor manda un código fijo; aquí se traduce al idioma actual.
        throw new Error(data.code ? t("error." + data.code) : t("error.CHECKOUT_FAILED"));
      }
      // El carrito no se borra todavía: si el cliente cancela el pago,
      // queremos que lo encuentre intacto al volver.
      window.location.href = data.url;
    } catch (err) {
      const known = err && err.message && err.message !== "Failed to fetch";
      els.checkoutError.textContent = known ? err.message : t("error.NETWORK");
      els.checkoutError.hidden = false;
      els.checkoutButton.disabled = false;
      els.checkoutButton.textContent = t("checkout.pay");
    }
  });

  // ---------- Arranque / Startup ----------
  async function init() {
    applyTranslations();
    try {
      const [configRes, menuRes] = await Promise.all([fetch("/api/config"), fetch("/api/menu")]);
      state.config = await configRes.json();
      state.menu = await menuRes.json();
      renderMenu();
      renderCart();
    } catch {
      const p = document.createElement("p");
      p.className = "loading";
      p.textContent = t("menu.loadError");
      els.menuRoot.innerHTML = "";
      els.menuRoot.appendChild(p);
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
