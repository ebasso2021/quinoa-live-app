// Lógica de la API de Quinoa, escrita de forma neutral: cada handler recibe
// (req, res) usando solo lo que existe tanto en Express (servidor local)
// como en las funciones de Vercel (req.query, req.body, res.status().json()).
//
// Así el mismo código corre en los dos lados:
//   - Local:  server/app.js monta estos handlers en Express.
//   - Vercel: los archivos de la carpeta api/ los exportan uno por uno.
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

// GET /api/config — datos públicos que el frontend necesita al arrancar.
function config(req, res) {
  res.status(200).json({
    businessName: BUSINESS_NAME,
    currency: menu.currency,
    paymentsEnabled: hasStripeKey,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
}

// GET /api/menu — el menú completo.
function menuHandler(req, res) {
  res.status(200).json(menu);
}

// POST /api/checkout — crea la sesión de pago en Stripe.
// SIEMPRE se recalculan los precios aquí con menu.js: nunca se confía en el
// precio que mande el navegador, por seguridad.
async function checkout(req, res) {
  try {
    if (!hasStripeKey || !stripe) {
      return res.status(400).json({
        error:
          "El pago con tarjeta todavía no está configurado. Agrega tus claves de Stripe (ver .env.example o las variables de entorno en Vercel)."
      });
    }

    const { items, customer } = readBody(req);
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío." });
    }
    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ error: "Falta el nombre o teléfono del cliente." });
    }
    if (!["pickup", "delivery"].includes(customer.orderType)) {
      return res.status(400).json({ error: "Tipo de pedido inválido." });
    }
    if (customer.orderType === "delivery" && !customer.address) {
      return res.status(400).json({ error: "Falta la dirección de entrega." });
    }

    const line_items = [];
    const orderItems = [];
    for (const cartItem of items) {
      const menuItem = findMenuItem(cartItem.id);
      const qty = Math.max(1, Math.min(20, parseInt(cartItem.qty, 10) || 1));
      if (!menuItem) {
        return res.status(400).json({ error: `Producto no encontrado: ${cartItem.id}` });
      }
      line_items.push({
        quantity: qty,
        price_data: {
          currency: menu.currency,
          unit_amount: menuItem.price,
          product_data: {
            name: menuItem.name,
            description: menuItem.description
          }
        }
      });
      orderItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, qty });
    }

    const deliveryFee = customer.orderType === "delivery" ? 300 : 0; // $3.00, ajustable
    if (deliveryFee > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: menu.currency,
          unit_amount: deliveryFee,
          product_data: { name: "Costo de entrega" }
        }
      });
    }

    const orderId = nanoid(10);
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // Visa, Mastercard, Amex, etc.
      line_items,
      success_url: `${APP_BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/cancel.html`,
      customer_email: customer.email || undefined,
      metadata: {
        orderId,
        customerName: customer.name,
        customerPhone: customer.phone,
        orderType: customer.orderType,
        address: customer.address || "",
        notes: customer.notes || ""
      }
    });

    await store.addOrder({
      orderId,
      stripeSessionId: session.id,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      customer,
      items: orderItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creando la sesión de pago:", err);
    res.status(500).json({ error: "No se pudo iniciar el pago. Intenta de nuevo." });
  }
}

// GET /api/order-status?session_id=... — confirma con Stripe que sí se pagó.
async function orderStatus(req, res) {
  try {
    if (!hasStripeKey || !stripe) {
      return res.status(400).json({ error: "Pagos no configurados." });
    }
    const session_id = (req.query || {}).session_id;
    if (!session_id) return res.status(400).json({ error: "Falta session_id." });

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
    console.error("Error consultando el estado del pedido:", err);
    res.status(500).json({ error: "No se pudo confirmar el pedido." });
  }
}

// GET /api/orders — lista de pedidos (sin contraseña; ver nota en el README).
async function orders(req, res) {
  res.status(200).json(await store.listOrders());
}

module.exports = {
  config,
  menu: menuHandler,
  checkout,
  orderStatus,
  orders,
  meta: { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey }
};
