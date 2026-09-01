// Arranca el servidor localmente (npm start / npm run dev).
// La app en sí está en index.js, en la raíz del proyecto — ahí tiene que
// estar para que Vercel la detecte. Este archivo solo la pone a escuchar
// en un puerto para trabajar en tu computadora.
const app = require("../index.js");
const { PORT, APP_BASE_URL, BUSINESS_NAME, hasStripeKey } = app.config;

app.listen(PORT, () => {
  console.log(`\n${BUSINESS_NAME} corriendo en ${APP_BASE_URL} (puerto ${PORT})`);
  if (!hasStripeKey) {
    console.log(
      "AVISO: no hay claves de Stripe configuradas todavía. El pago con tarjeta está desactivado hasta que edites el archivo .env (copia .env.example)."
    );
  }
});
