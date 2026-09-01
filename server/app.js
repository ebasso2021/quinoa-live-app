// La app de Quinoa (Express): sirve la PWA y maneja pedidos + pago con
// tarjeta vía Stripe. Este archivo NO arranca el servidor — solo define la
// app, para poder usarse tanto en local (server/index.js) como en Vercel
// (api/index.js), que la corre como función serverless.
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
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

const app = express();
app.use(cors());
app.use(express.json());
// En Vercel, los archivos de /public los sirve Vercel directamente (ver
// vercel.json) y esta línea no se usa. En local, sí sirve la app completa.
app.use(express.static(path.join(__dirname, "..", "public")));

function findMenuItem(itemId) {
  for (const cat of menu.categories) {
    const found = cat.items.find((i) => i.id === itemId);
    if (found) return found;
  }
  return null;
}

// ---------- API ----------

// Configuración pública (para que el frontend sepa el nombre del negocio, moneda, etc.)
app.get("/api/config", (req, res) => {
  res.json({
    businessName: BUSINESS_NAME,
    currency: menu.currency,
    paymentsEnabled: hasStripeKey,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  });
});

// Menú completo
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// Crear una sesión de pago (Stripe Checkout) a partir del carrito.
// SIEMPRE se recalculan los precios en el servidor usando menu.js — nunca se
// confía en el precio que mande el navegador, por seguridad.
app.post("/api/checkout", async (req, res) => {
  try {
    if (!hasStripeKey || !stripe) {
      return res.status(400).json({
        error:
          "El pago con tarjeta todavía no está configurado. Agrega tus claves de Stripe (ver .env.example o las variables de entorno en Vercel)."
      });
    }

    const { items, customer } = req.body || {};
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
      orderItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty
      });
    }

    const deliveryFee = customer.orderType === "delivery" ? 300 : 0; // $3.00 de envío, ajustable
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
      payment_method_types: ["card"], // acepta Visa, Mastercard, Amex, etc.
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

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error creando la sesión de pago:", err);
    res.status(500).json({ error: "No se pudo iniciar el pago. Intenta de nuevo." });
  }
});

// El frontend llama esto en la página de éxito para confirmar que el pago
// realmente se completó (Stripe es la fuente de verdad, no el navegador).
app.get("/api/order-status", async (req, res) => {
  try {
    if (!hasStripeKey || !stripe) {
      return res.status(400).json({ error: "Pagos no configurados." });
    }
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: "Falta session_id." });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    let order = await store.findOrderBySessionId(session_id);

    if (order && session.payment_status === "paid" && order.status !== "paid") {
      order = await store.markOrderPaid(session_id);
    }

    res.json({
      paid: session.payment_status === "paid",
      order: order || null
    });
  } catch (err) {
    console.error("Error consultando el estado del pedido:", err);
    res.status(500).json({ error: "No se pudo confirmar el pedido." });
  }
});

// Lista simple de pedidos para el dueño del negocio (sin autenticación —
// pensado solo para uso local/interno; ver nota de seguridad en el README).
app.get("/api/orders", async (req, res) => {
  res.json(await store.listOrders());
});

module.exports = app;
module.exports.config = { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey };
