// Lógica de la API de Quinoa / Quinoa's API logic.
//
// Cada handler recibe (req, res) usando solo lo que existe tanto en Express
// (servidor local) como en las funciones de Vercel: req.query, req.body,
// res.status().json(). Así el mismo código corre en los dos lados:
//   - Local:  server/app.js monta estos handlers en Express.
//   - Vercel: los archivos de api/ los exportan uno por uno.
//
// Sobre idiomas: los errores se responden con un `code` (identificador fijo,
// no traducible) y un `error` en inglés como respaldo. El navegador traduce
// el `code` al idioma que el cliente tenga elegido, así el servidor no
// necesita saber en qué idioma está viendo la app cada persona.
require("dotenv").config();
const { nanoid } = require("nanoid");
const menu = require("./menu");
const store = require("./store");

const PORT = process.env.PORT || 3000;
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`);
const BUSINESS_NAME = process.env.BUSINESS_NAME || "Quinoa";

const hasStripeKey =
  !!process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_reemplaza_esto";

const stripe = hasStripeKey ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const SUPPORTED_LANGS = ["en", "es"];
const DEFAULT_LANG = "en";

function pickLang(value) {
  return SUPPORTED_LANGS.includes(value) ? value : DEFAULT_LANG;
}

// Devuelve el texto en el idioma pedido (los textos del menú son {en, es}).
function t(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field[DEFAULT_LANG] || "";
}

function findMenuItem(itemId) {
  for (const cat of menu.categories) {
    const found = cat.items.find((i) => i.id === itemId);
    if (found) return found;
  }
  return null;
}

// Vercel no siempre parsea el cuerpo de la petición; Express sí (express.json).
// Esto cubre los dos casos sin romper ninguno.
function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function fail(res, status, code, englishMessage) {
  return res.status(status).json({ code, error: englishMessage });
}

// GET /api/config — datos públicos que el frontend necesita al arrancar.
function config(req, res) {
  res.status(200).json({
    businessName: BUSINESS_NAME,
    currency: menu.currency,
    paymentsEnabled: hasStripeKey,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    languages: SUPPORTED_LANGS,
    defaultLanguage: DEFAULT_LANG
  });
}

// GET /api/menu — el menú completo, con los textos en los dos idiomas.
// El navegador elige cuál mostrar según el idioma seleccionado.
function menuHandler(req, res) {
  res.status(200).json(menu);
}

// POST /api/checkout — crea la sesión de pago en Stripe.
// SIEMPRE se recalculan los precios aquí con menu.js: nunca se confía en el
// precio que mande el navegador, por seguridad.
async function checkout(req, res) {
  try {
    if (!hasStripeKey || !stripe) {
      return fail(
        res,
        400,
        "PAYMENTS_NOT_CONFIGURED",
        "Card payments are not configured yet. Add your Stripe keys (see .env.example or the environment variables in Vercel)."
      );
    }

    const body = readBody(req);
    const { items, customer } = body;
    const lang = pickLang(body.lang);

    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, 400, "CART_EMPTY", "Your cart is empty.");
    }
    if (!customer || !customer.name || !customer.phone) {
      return fail(res, 400, "MISSING_CUSTOMER", "Customer name or phone is missing.");
    }
    if (!["pickup", "delivery"].includes(customer.orderType)) {
      return fail(res, 400, "INVALID_ORDER_TYPE", "Invalid order type.");
    }
    if (customer.orderType === "delivery" && !customer.address) {
      return fail(res, 400, "MISSING_ADDRESS", "Delivery address is missing.");
    }

    const line_items = [];
    const orderItems = [];
    for (const cartItem of items) {
      const menuItem = findMenuItem(cartItem.id);
      const qty = Math.max(1, Math.min(20, parseInt(cartItem.qty, 10) || 1));
      if (!menuItem) {
        return fail(res, 400, "PRODUCT_NOT_FOUND", `Product not found: ${cartItem.id}`);
      }
      line_items.push({
        quantity: qty,
        price_data: {
          currency: menu.currency,
          unit_amount: menuItem.price,
          product_data: {
            name: t(menuItem.name, lang),
            description: t(menuItem.description, lang)
          }
        }
      });
      // El pedido se guarda con los dos idiomas, para poder mostrarlo
      // correctamente sin importar quién lo consulte después.
      orderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty
      });
    }

    const deliveryFee = customer.orderType === "delivery" ? 300 : 0; // $3.00, ajustable
    if (deliveryFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: menu.currency,
          unit_amount: deliveryFee,
          product_data: { name: t(menu.labels.deliveryFee, lang) }
        }
      });
    }

    const orderId = nanoid(10);
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // Visa, Mastercard, Amex, etc.
      locale: lang, // La página de pago de Stripe sale en el mismo idioma.
      line_items,
      success_url: `${APP_BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}&lang=${lang}`,
      cancel_url: `${APP_BASE_URL}/cancel.html?lang=${lang}`,
      customer_email: customer.email || undefined,
      metadata: {
        orderId,
        customerName: customer.name,
        customerPhone: customer.phone,
        orderType: customer.orderType,
        address: customer.address || "",
        notes: customer.notes || "",
        lang
      }
    });

    await store.addOrder({
      orderId,
      stripeSessionId: session.id,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      lang,
      customer,
      items: orderItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating the payment session:", err);
    return fail(res, 500, "CHECKOUT_FAILED", "Could not start the payment. Please try again.");
  }
}

// GET /api/order-status?session_id=... — confirma con Stripe que sí se pagó.
async function orderStatus(req, res) {
  try {
    if (!hasStripeKey || !stripe) {
      return fail(res, 400, "PAYMENTS_NOT_CONFIGURED", "Payments are not configured.");
    }
    const session_id = (req.query || {}).session_id;
    if (!session_id) {
      return fail(res, 400, "MISSING_SESSION_ID", "Missing session_id.");
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    let order = await store.findOrderBySessionId(session_id);

    if (order && session.payment_status === "paid" && order.status !== "paid") {
      order = await store.markOrderPaid(session_id);
    }

    res.status(200).json({
      paid: session.payment_status === "paid",
      currency: menu.currency,
      order: order || null
    });
  } catch (err) {
    console.error("Error checking the order status:", err);
    return fail(res, 500, "ORDER_STATUS_FAILED", "Could not confirm the order.");
  }
}

// GET /api/orders — lista de pedidos (sin contraseña; ver nota en el README).
async function orders(req, res) {
  res.status(200).json(await store.listOrders());
}

// GET /api/storage-status — diagnóstico: ¿dónde se están guardando los
// pedidos y funciona de verdad? Sirve para confirmar de un vistazo que la
// base de datos quedó bien conectada. No expone ninguna credencial.
async function storageStatus(req, res) {
  const info = await store.status();
  const paymentsReady = hasStripeKey;
  res.status(200).json({
    storage: info,
    payments: {
      ok: paymentsReady,
      detail: paymentsReady
        ? "Claves de Stripe configuradas: se pueden cobrar pedidos."
        : "Faltan las claves de Stripe: nadie puede pagar todavía."
    },
    readyToTakeOrders: info.ok && paymentsReady
  });
}

module.exports = {
  config,
  menu: menuHandler,
  checkout,
  orderStatus,
  orders,
  storageStatus,
  meta: { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey }
};
