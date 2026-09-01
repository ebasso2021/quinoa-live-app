// Punto de entrada para Vercel: convierte la app de Express en una función
// serverless. Vercel enruta aquí todo lo que empiece con /api/ (ver
// vercel.json); Express, dentro, decide cuál ruta exacta responde
// (/api/config, /api/menu, /api/checkout, etc.).
module.exports = require("../server/app");
