// Lógica de la página de éxito: confirma el pago contra el servidor (que a su
// vez confirma contra Stripe) y limpia el carrito guardado localmente.
(function () {
  const CART_KEY = "quinoa_cart_v1";
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const iconEl = document.getElementById("status-icon");
  const titleEl = document.getElementById("status-title");
  const msgEl = document.getElementById("status-message");
  const detailsEl = document.getElementById("order-details");

  function money(cents, currency) {
    // "en-CA" da el formato canadiense limpio: $10.50
    return (cents / 100).toLocaleString("en-CA", {
      style: "currency",
      currency: (currency || "cad").toUpperCase()
    });
  }

  async function check() {
    if (!sessionId) {
      iconEl.textContent = "⚠️";
      titleEl.textContent = "No encontramos tu pedido";
      msgEl.textContent = "Vuelve al menú e intenta de nuevo.";
      return;
    }
    try {
      const res = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.paid) {
        localStorage.removeItem(CART_KEY);
        iconEl.textContent = "✅";
        titleEl.textContent = "¡Pedido confirmado!";
        msgEl.textContent = "Gracias por tu compra. Tu pago fue procesado correctamente.";
        if (data.order) {
          const o = data.order;
          detailsEl.hidden = false;
          detailsEl.innerHTML = `
            <strong>Pedido #${o.orderId}</strong><br/>
            ${o.customer.orderType === "delivery" ? "Entrega a domicilio" : "Recoger en tienda"}<br/>
            Total: ${money(o.total, data.currency)}
          `;
        }
      } else {
        iconEl.textContent = "⏳";
        titleEl.textContent = "Aún procesando tu pago…";
        msgEl.textContent = "Si acabas de pagar, espera unos segundos y recarga esta página.";
      }
    } catch (err) {
      iconEl.textContent = "⚠️";
      titleEl.textContent = "No se pudo confirmar el pago";
      msgEl.textContent = "Revisa tu conexión e intenta recargar la página.";
    }
  }

  check();
})();
