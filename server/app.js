// Servidor de Express para trabajar en TU COMPUTADORA (npm start).
//
// En Vercel este archivo no se usa: allá cada ruta de la API vive en su
// propio archivo dentro de la carpeta api/ (que Vercel convierte en
// funciones automáticamente), y los archivos de public/ los sirve su CDN.
// Los dos caminos comparten exactamente la misma lógica: server/handlers.js.
require("dotenv").config();
const path = require("path");
const express = require("express");
const handlers = require("./handlers");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/config", handlers.config);
app.get("/api/menu", handlers.menu);
app.post("/api/checkout", handlers.checkout);
app.get("/api/order-status", handlers.orderStatus);
app.get("/api/orders", handlers.orders);
app.get("/api/storage-status", handlers.storageStatus);

module.exports = app;
module.exports.meta = handlers.meta;
