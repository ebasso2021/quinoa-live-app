// Pantalla de "pedido confirmado": confirma el pago contra el servidor (que a
// su vez lo confirma con Stripe) y limpia el carrito guardado.
// "Order confirmed" screen: confirms the payment against the server (which in
// turn confirms it with Stripe) and clears the saved cart.
(function () {
  const CART_KEY = "quinoa_cart_v1";
  const L = window.QuinoaLang;
  const lang = L.current();
  const t = (key) => L.t(key, lang);
  const field = (value) => L.field(value, lang);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const iconEl = document.getElementById("status-icon");
  const titleEl = document.getElementById("status-title");
  const msgEl = document.getElementById("status-message");
  const detailsEl = document.getElementById("order-details");
  const backEl = document.getElementById("status-back");

  document.documentElement.lang = lang;
  backEl.textContent = t("status.back");
  backEl.href = "/?lang=" + lang;
  titleEl.textContent = t("status.confirmingTitle");
  msgEl.textContent = t("status.confirmingMessage");
  document.title = "Quinoa — " + t("status.confirmedTitle");

  function money(cents, currency) {
    return (cents / 100).toLocaleString("en-CA", {
      style: "currency",
      currency: (currency || "cad").toUpperCase()
    });
  }

  function show(icon, titleKey, messageKey) {
    iconEl.textContent = icon;
    titleEl.textContent = t(titleKey);
    msgEl.textContent = t(messageKey);
  }

  function renderOrder(order, currency) {
    detailsEl.hidden = false;
    detailsEl.innerHTML = "";

    const number = document.createElement("strong");
    number.textContent = t("status.orderNumber") + order.orderId;
    detailsEl.appendChild(number);
    detailsEl.appendChild(document.createElement("br"));

    const type = document.createElement("span");
    type.textContent =
      order.customer.orderType === "delivery" ? t("status.delivery") : t("status.pickup");
    detailsEl.appendChild(type);
    detailsEl.appendChild(document.createElement("br"));

    // Los platillos se guardaron en los dos idiomas, así que se muestran
    // en el que el cliente tenga elegido ahora.
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const line = document.createElement("div");
        line.textContent = `${item.qty} × ${field(item.name)}`;
        detailsEl.appendChild(line);
      }
    }

    const total = document.createElement("div");
    total.textContent = `${t("status.total")} ${money(order.total, currency)}`;
    detailsEl.appendChild(total);
  }

  async function check() {
    if (!sessionId) {
      show("⚠️", "status.notFoundTitle", "status.notFoundMessage");
      return;
    }
    try {
      const res = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();

      if (data.paid) {
        try {
          localStorage.removeItem(CART_KEY);
        } catch {
          /* si el navegador bloquea el borrado, no pasa nada grave */
        }
        show("✅", "status.confirmedTitle", "status.confirmedMessage");
        if (data.order) renderOrder(data.order, data.currency);
      } else {
        show("⏳", "status.processingTitle", "status.processingMessage");
      }
    } catch {
      show("⚠️", "status.errorTitle", "status.errorMessage");
    }
  }

  check();
})();
