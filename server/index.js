// Arranca el servidor en tu computadora: npm start
// (En Vercel no se usa este archivo — ver el comentario en server/app.js.)
const app = require("./app");
const { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey } = app.meta;

app.listen(PORT, () => {
  console.log(`\n${BUSINESS_NAME} corriendo en ${APP_BASE_URL} (puerto ${PORT})`);
  if (!hasStripeKey) {
    console.log(
      "AVISO: no hay claves de Stripe configuradas todavía. El pago con tarjeta está desactivado hasta que edites el archivo .env (copia .env.example)."
    );
  }
});
