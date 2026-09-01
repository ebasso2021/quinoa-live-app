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

// Busca las credenciales de Redis sin depender de un nombre exacto de
// variable: cada integración las llama distinto (Upstash directo, las
// antiguas de "Vercel KV", las del Marketplace con prefijo propio...).
// Primero prueba los nombres conocidos y, si no encuentra ninguno, busca
// cualquier par de variables <ALGO>_REST_URL / <ALGO>_REST_TOKEN.
function detectRedisCredentials() {
  const knownPairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["REDIS_REST_URL", "REDIS_REST_TOKEN"]
  ];

  for (const [urlKey, tokenKey] of knownPairs) {
    if (process.env[urlKey] && process.env[tokenKey]) {
      return { url: process.env[urlKey], token: process.env[tokenKey], source: urlKey };
    }
  }

  for (const key of Object.keys(process.env)) {
    if (key.endsWith("_REST_URL")) {
      const tokenKey = key.replace(/_REST_URL$/, "_REST_TOKEN");
      if (process.env[key] && process.env[tokenKey]) {
        return { url: process.env[key], token: process.env[tokenKey], source: key };
      }
    }
  }

  return null;
}

const credentials = detectRedisCredentials();
const useRedis = !!credentials;
const isVercel = !!process.env.VERCEL;

let redis = null;
if (useRedis) {
  // Se importa solo si hace falta, para no requerir el paquete en local.
  const { Redis } = require("@upstash/redis");
  redis = new Redis({ url: credentials.url, token: credentials.token });
} else if (isVercel) {
  console.warn(
    "AVISO: corriendo en Vercel sin una base de datos Redis conectada. Los pedidos se guardan solo en memoria y se pueden perder. Conecta una integración de Redis (ej. Upstash) desde Vercel → Storage y vuelve a desplegar."
  );
}

// Diagnóstico: dice qué almacenamiento está en uso y, si es Redis, prueba
// de verdad que las credenciales sirvan (escribe y lee un valor temporal).
// No devuelve ninguna credencial, solo el NOMBRE de la variable encontrada.
async function status() {
  // Nombres (NUNCA valores) de las variables que podrían ser de una base de
  // datos. Sirve para ver si la integración inyectó algo y cómo lo llamó.
  const candidateNames = Object.keys(process.env)
    .filter((k) => /REDIS|UPSTASH|^KV_|DATABASE|STORAGE/i.test(k))
    .sort();

  if (!useRedis) {
    return {
      type: isVercel ? "memory" : "file",
      ok: !isVercel, // en memoria (Vercel sin Redis) NO es un estado válido
      envVarsFound: candidateNames,
      detail: isVercel
        ? candidateNames.length
          ? "Hay variables que parecen de base de datos, pero no forman un par URL + TOKEN reconocible. Revisa 'envVarsFound' para ver cómo se llaman."
          : "No llegó ninguna variable de base de datos: falta conectar la base de datos al proyecto (Storage → tu base de datos → Projects → Connect Project) y volver a desplegar."
        : "Guardando en server/data/orders.json (modo local)."
    };
  }

  try {
    const probeKey = "quinoa:health-check";
    const stamp = new Date().toISOString();
    await redis.set(probeKey, stamp, { ex: 60 });
    const readBack = await redis.get(probeKey);
    const works = readBack === stamp;
    return {
      type: "redis",
      ok: works,
      envVar: credentials.source,
      detail: works
        ? "Base de datos conectada y funcionando: se escribió y se leyó un valor de prueba."
        : "Se conectó a Redis pero el valor leído no coincide con el escrito."
    };
  } catch (err) {
    return {
      type: "redis",
      ok: false,
      envVar: credentials.source,
      detail: "No se pudo conectar a Redis: " + (err && err.message ? err.message : String(err))
    };
  }
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

module.exports = {
  addOrder,
  findOrderBySessionId,
  markOrderPaid,
  listOrders,
  status,
  useRedis,
  isVercel
};
