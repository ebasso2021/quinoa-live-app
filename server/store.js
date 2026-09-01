// Almacenamiento de pedidos.
//
// - En tu computadora (npm start): se guarda en server/data/orders.json,
//   igual que antes. Simple, no requiere nada extra.
// - En Vercel: los archivos se borran en cada despliegue y no sirven como
//   base de datos, así que aquí se usa Redis (vía Upstash, el reemplazo
//   oficial de "Vercel KV", que Vercel dejó de ofrecer). Para activarlo:
//   en el dashboard de Vercel → tu proyecto → Storage → Marketplace →
//   busca "Upstash" (o cualquier integración de Redis) → conéctala. Vercel
//   inyecta las variables de entorno solo — no hay que copiar nada a mano.
//
// Mientras no haya un Redis conectado, en Vercel los pedidos se guardan
// solo en memoria (se pueden perder entre invocaciones). Por eso este
// archivo avisa por consola si detecta que corre en Vercel sin Redis
// configurado.

const path = require("path");
const fs = require("fs");

// Se aceptan varios nombres de variable porque distintas integraciones de
// Redis (Upstash directo, integraciones antiguas de "Vercel KV", etc.)
// pueden llamarlas distinto. Revisa "Project Settings → Environment
// Variables" en Vercel si quieres confirmar el nombre exacto en tu caso.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.REDIS_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.REDIS_TOKEN;

const useRedis = !!(REDIS_URL && REDIS_TOKEN);
const isVercel = !!process.env.VERCEL;

let redis = null;
if (useRedis) {
  // Se importa solo si hace falta, para no requerir el paquete en local.
  const { Redis } = require("@upstash/redis");
  redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
} else if (isVercel) {
  console.warn(
    "AVISO: corriendo en Vercel sin una base de datos Redis conectada. Los pedidos se guardan solo en memoria y se pueden perder. Conecta una integración de Redis (ej. Upstash) desde Vercel → Storage y vuelve a desplegar."
  );
}

// ---------- Respaldo en memoria (solo si estamos en Vercel sin Redis) ----------
let memoryOrders = [];

// ---------- Respaldo en archivo (solo para desarrollo local) ----------
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureLocalFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
}
function readLocalFile() {
  ensureLocalFile();
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeLocalFile(orders) {
  ensureLocalFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

async function addOrder(order) {
  if (useRedis) {
    await redis.set(`order:${order.orderId}`, order);
    await redis.lpush("orders:index", order.orderId); // más reciente primero
    return order;
  }
  if (isVercel) {
    memoryOrders.unshift(order);
    return order;
  }
  const orders = readLocalFile();
  orders.push(order);
  writeLocalFile(orders);
  return order;
}

async function findOrderBySessionId(sessionId) {
  if (useRedis) {
    const ids = await redis.lrange("orders:index", 0, -1);
    for (const id of ids) {
      const order = await redis.get(`order:${id}`);
      if (order && order.stripeSessionId === sessionId) return order;
    }
    return null;
  }
  if (isVercel) {
    return memoryOrders.find((o) => o.stripeSessionId === sessionId) || null;
  }
  const orders = readLocalFile();
  return orders.find((o) => o.stripeSessionId === sessionId) || null;
}

async function markOrderPaid(sessionId) {
  if (useRedis) {
    const order = await findOrderBySessionId(sessionId);
    if (!order || order.status === "paid") return order;
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    await redis.set(`order:${order.orderId}`, order);
    return order;
  }
  if (isVercel) {
    const order = memoryOrders.find((o) => o.stripeSessionId === sessionId);
    if (order && order.status !== "paid") {
      order.status = "paid";
      order.paidAt = new Date().toISOString();
    }
    return order || null;
  }
  const orders = readLocalFile();
  const order = orders.find((o) => o.stripeSessionId === sessionId);
  if (order && order.status !== "paid") {
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    writeLocalFile(orders);
  }
  return order || null;
}

async function listOrders() {
  if (useRedis) {
    const ids = await redis.lrange("orders:index", 0, -1);
    if (!ids.length) return [];
    const orders = await Promise.all(ids.map((id) => redis.get(`order:${id}`)));
    return orders.filter(Boolean);
  }
  if (isVercel) {
    return memoryOrders;
  }
  return readLocalFile().slice().reverse();
}

module.exports = { addOrder, findOrderBySessionId, markOrderPaid, listOrders, useRedis, isVercel };
