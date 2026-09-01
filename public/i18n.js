// Todos los textos de la interfaz, en los dos idiomas.
// All interface texts, in both languages.
//
// El idioma por defecto es inglés / Default language is English.
// Para agregar un texto nuevo: ponlo en las DOS listas con la misma clave.
// To add a new text: add it to BOTH lists using the same key.

window.QUINOA_DEFAULT_LANG = "en";

window.QUINOA_I18N = {
  en: {
    "page.title": "Quinoa — Order online",
    "page.description": "Order your favourite Quinoa dishes and pay by card from your phone.",

    "nav.cart": "View cart",
    "banner.offline": "You're offline — some features may not be available.",
    "banner.paymentsOff": "Card payments haven't been switched on by the restaurant yet.",

    "menu.loading": "Loading menu…",
    "menu.loadError": "We couldn't load the menu. Check your connection and try again.",
    "menu.add": "Add",

    "cart.title": "Your order",
    "cart.close": "Close cart",
    "cart.empty": "Your cart is empty.",
    "cart.subtotal": "Subtotal",
    "cart.delivery": "Delivery",
    "cart.total": "Total",

    "form.name": "Full name",
    "form.phone": "Phone",
    "form.email": "Email (optional, for your receipt)",
    "form.pickup": "Pick up in store",
    "form.delivery": "Delivery",
    "form.address": "Delivery address",
    "form.notes": "Order notes (optional)",
    "form.notesPlaceholder": "E.g. no onion, ring the doorbell, etc.",

    "checkout.pay": "Pay by card 💳",
    "checkout.redirecting": "Taking you to secure payment…",

    "footer.note": "Payments are securely processed by Stripe. Quinoa never stores your card details.",

    "status.confirmingTitle": "Confirming your payment…",
    "status.confirmingMessage": "One moment please.",
    "status.confirmedTitle": "Order confirmed!",
    "status.confirmedMessage": "Thank you for your purchase. Your payment went through successfully.",
    "status.processingTitle": "Still processing your payment…",
    "status.processingMessage": "If you've just paid, wait a few seconds and reload this page.",
    "status.notFoundTitle": "We couldn't find your order",
    "status.notFoundMessage": "Go back to the menu and try again.",
    "status.errorTitle": "We couldn't confirm the payment",
    "status.errorMessage": "Check your connection and try reloading the page.",
    "status.orderNumber": "Order #",
    "status.pickup": "Pick up in store",
    "status.delivery": "Delivery",
    "status.total": "Total:",
    "status.back": "Back to menu",

    "cancel.title": "Payment cancelled",
    "cancel.message": "No charge was made. Your cart is still saved — you can try again whenever you like.",

    // Errores que manda el servidor (se traducen por su código).
    "error.PAYMENTS_NOT_CONFIGURED": "Card payments aren't set up yet. Please contact the restaurant.",
    "error.CART_EMPTY": "Your cart is empty.",
    "error.MISSING_CUSTOMER": "Please enter your name and phone number.",
    "error.INVALID_ORDER_TYPE": "Please choose pickup or delivery.",
    "error.MISSING_ADDRESS": "Please enter your delivery address.",
    "error.PRODUCT_NOT_FOUND": "One of the items is no longer available. Please refresh the page.",
    "error.CHECKOUT_FAILED": "We couldn't start the payment. Please try again.",
    "error.MISSING_SESSION_ID": "We couldn't find your order.",
    "error.ORDER_STATUS_FAILED": "We couldn't confirm the order.",
    "error.NETWORK": "We couldn't reach the server. Check your connection and try again."
  },

  es: {
    "page.title": "Quinoa — Pedidos en línea",
    "page.description": "Ordena tus platillos favoritos de Quinoa y paga con tarjeta desde tu celular.",

    "nav.cart": "Ver carrito",
    "banner.offline": "Sin conexión — algunas funciones pueden no estar disponibles.",
    "banner.paymentsOff": "El restaurante todavía no ha activado el pago con tarjeta.",

    "menu.loading": "Cargando menú…",
    "menu.loadError": "No se pudo cargar el menú. Verifica tu conexión e intenta de nuevo.",
    "menu.add": "Agregar",

    "cart.title": "Tu pedido",
    "cart.close": "Cerrar carrito",
    "cart.empty": "Tu carrito está vacío.",
    "cart.subtotal": "Subtotal",
    "cart.delivery": "Entrega",
    "cart.total": "Total",

    "form.name": "Nombre completo",
    "form.phone": "Teléfono",
    "form.email": "Correo (opcional, para tu recibo)",
    "form.pickup": "Recoger en tienda",
    "form.delivery": "Entrega a domicilio",
    "form.address": "Dirección de entrega",
    "form.notes": "Notas para tu pedido (opcional)",
    "form.notesPlaceholder": "Ej: sin cebolla, tocar el timbre, etc.",

    "checkout.pay": "Pagar con tarjeta 💳",
    "checkout.redirecting": "Llevándote al pago seguro…",

    "footer.note": "Pagos procesados de forma segura por Stripe. Quinoa nunca guarda los datos de tu tarjeta.",

    "status.confirmingTitle": "Confirmando tu pago…",
    "status.confirmingMessage": "Un momento por favor.",
    "status.confirmedTitle": "¡Pedido confirmado!",
    "status.confirmedMessage": "Gracias por tu compra. Tu pago fue procesado correctamente.",
    "status.processingTitle": "Aún procesando tu pago…",
    "status.processingMessage": "Si acabas de pagar, espera unos segundos y recarga esta página.",
    "status.notFoundTitle": "No encontramos tu pedido",
    "status.notFoundMessage": "Vuelve al menú e intenta de nuevo.",
    "status.errorTitle": "No se pudo confirmar el pago",
    "status.errorMessage": "Revisa tu conexión e intenta recargar la página.",
    "status.orderNumber": "Pedido #",
    "status.pickup": "Recoger en tienda",
    "status.delivery": "Entrega a domicilio",
    "status.total": "Total:",
    "status.back": "Volver al menú",

    "cancel.title": "Pago cancelado",
    "cancel.message": "No se realizó ningún cargo. Tu carrito sigue guardado, puedes intentarlo de nuevo cuando quieras.",

    // Errors sent by the server (translated by their code).
    "error.PAYMENTS_NOT_CONFIGURED": "El pago con tarjeta aún no está configurado. Comunícate con el restaurante.",
    "error.CART_EMPTY": "Tu carrito está vacío.",
    "error.MISSING_CUSTOMER": "Escribe tu nombre y tu teléfono.",
    "error.INVALID_ORDER_TYPE": "Elige si vas a recoger o quieres entrega a domicilio.",
    "error.MISSING_ADDRESS": "Escribe tu dirección de entrega.",
    "error.PRODUCT_NOT_FOUND": "Uno de los productos ya no está disponible. Recarga la página.",
    "error.CHECKOUT_FAILED": "No se pudo iniciar el pago. Intenta de nuevo.",
    "error.MISSING_SESSION_ID": "No encontramos tu pedido.",
    "error.ORDER_STATUS_FAILED": "No se pudo confirmar el pedido.",
    "error.NETWORK": "No pudimos conectar con el servidor. Verifica tu conexión e intenta de nuevo."
  }
};

// Utilidades compartidas por las páginas / Helpers shared by the pages.
window.QuinoaLang = {
  STORAGE_KEY: "quinoa_lang",

  // Orden: lo que el usuario eligió antes > ?lang= en la dirección > inglés.
  current() {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      if (fromUrl && window.QUINOA_I18N[fromUrl]) return fromUrl;
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && window.QUINOA_I18N[saved]) return saved;
    } catch {
      /* localStorage bloqueado: seguimos con el idioma por defecto */
    }
    return window.QUINOA_DEFAULT_LANG;
  },

  set(lang) {
    if (!window.QUINOA_I18N[lang]) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch {
      /* si no se puede guardar, el idioma dura solo esta visita */
    }
  },

  // Traduce una clave / Translates a key.
  t(key, lang) {
    const dict = window.QUINOA_I18N[lang] || window.QUINOA_I18N[window.QUINOA_DEFAULT_LANG];
    return dict[key] !== undefined ? dict[key] : key;
  },

  // Traduce un campo del menú, que viene como { en: "...", es: "..." }.
  field(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value[window.QUINOA_DEFAULT_LANG] || "";
  }
};
