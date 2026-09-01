// Arranca el servidor localmente (npm start / npm run dev).
// En Vercel no se usa este archivo — ahí la app corre como función
// serverless a través de api/index.js.
const app = require("./app");
const { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey } = app.config;

app.listen(PORT, () => {
  console.log(`\n${BUSINESS_NAME} corriendo en ${APP_BASE_URL} (puerto ${PORT})`);
  if (!hasStripeKey) {
    console.log(
      "AVISO: no hay claves de Stripe configuradas todavía. El pago con tarjeta está desactivado hasta que edites el archivo .env (copia .env.example)."
    );
  }
});
