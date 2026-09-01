// Punto de entrada que Vercel detecta automáticamente (soporte "cero
// configuración" para Express: busca index.js/app.js/server.js en la raíz).
// No hace falta vercel.json ni carpeta api/ — Vercel convierte esta app de
// Express en una función y sirve todo lo que está en /public por su CDN
// automáticamente.
module.exports = require("./server/app");
