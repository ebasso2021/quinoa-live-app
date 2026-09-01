# Quinoa — App de pedidos con pago con tarjeta

App web instalable (PWA) para que tus clientes ordenen desde el celular
(Android o iPhone) y paguen con tarjeta de crédito/débito (Visa, Mastercard,
Amex, etc.) de forma segura con **Stripe**.

No es una app "nativa" de las tiendas de aplicaciones — es una página web que
el cliente instala en su pantalla de inicio y se ve y se siente como una app.
Esto evita el proceso de revisión de Apple/Google, es más rápido de lanzar y
funciona igual en ambos teléfonos con un solo código.

## 1. Requisitos

- [Node.js](https://nodejs.org) 18 o más nuevo instalado en la computadora
  donde correrá el servidor.
- Una cuenta gratuita de [Stripe](https://dashboard.stripe.com/register)
  (para poder cobrar con tarjeta).

## 2. Instalación

Abre una terminal en esta carpeta (`quinoa-live app`) y ejecuta:

```
npm install
```

## 3. Configurar el pago con tarjeta (Stripe)

1. Copia el archivo `.env.example` y renómbralo a `.env`.
2. Entra a tu [panel de Stripe → Developers → API keys](https://dashboard.stripe.com/apikeys).
3. Copia tu **Publishable key** y tu **Secret key** y pégalas en `.env`:

   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
   ```

   - Mientras uses las claves que dicen `sk_test_...` / `pk_test_...`, los
     pagos son de **prueba** — no se cobra dinero real. Puedes pagar con la
     tarjeta de prueba `4242 4242 4242 4242`, cualquier fecha futura y
     cualquier CVC.
   - Cuando termines de probar, activa tu cuenta de Stripe (te pedirá tus
     datos bancarios y de tu negocio) y cambia las claves por las que
     empiezan con `sk_live_` / `pk_live_`. Desde ese momento los cobros con
     tarjeta son **reales** y el dinero se deposita en tu cuenta bancaria
     según el calendario de pagos de Stripe.

## 4. Personalizar el menú

Edita `server/menu.js`: agrega, quita o cambia platillos, precios (en
centavos, ej. `1050` = $10.50), categorías y fotos. Los cambios se ven al
recargar la app, sin necesidad de reinstalar nada.

También puedes cambiar el nombre del negocio y la moneda en `.env`
(`BUSINESS_NAME`) y en `server/menu.js` (`currency`). La app está configurada
en dólares canadienses (`"cad"`); si algún día cambias de país, ahí puedes
poner `"usd"`, `"mxn"`, `"eur"`, etc.

## 4b. Idiomas (inglés y español)

La app está en los dos idiomas, con pestañas arriba a la derecha. **El idioma
por defecto es inglés**; cuando alguien elige español, su navegador lo
recuerda para las próximas visitas.

Dónde se cambia cada cosa:

- **Textos de la interfaz** (botones, formulario, mensajes): `public/i18n.js`.
  Cada texto tiene su clave con la versión en `en` y en `es`. Si agregas un
  texto nuevo, ponlo en **las dos listas**.
- **Platillos, descripciones y categorías**: `server/menu.js`. Cada nombre y
  descripción se escribe así: `{ en: "Classic Bowl", es: "Bowl Clásico" }`.
- **Mensajes de error del servidor**: el servidor manda un código fijo
  (por ejemplo `CART_EMPTY`) y el navegador lo traduce con la clave
  `error.CART_EMPTY` de `public/i18n.js`. Así el servidor no necesita saber
  en qué idioma está viendo la app cada cliente.

La página de pago de Stripe también sale en el idioma que el cliente eligió.

## 5. Arrancar el servidor

```
npm start
```

Verás un mensaje como:

```
Quinoa corriendo en http://localhost:3000 (puerto 3000)
```

Abre esa dirección en tu navegador para ver la app funcionando.

## 6. Instalar la app en tu celular (Android e iPhone)

Para que el celular pueda abrir la app, la computadora donde corre `npm
start` y el celular deben poder alcanzar esa dirección por internet (no solo
`localhost`, que solo funciona en la misma computadora). Para eso:

- **Más fácil — publicarla en internet:** este proyecto ya está preparado
  para desplegarse en **Vercel** (ver la sección 11 más abajo) o en
  cualquier hosting que soporte Node.js, como [Render](https://render.com) o
  [Railway](https://railway.app). Te dará una dirección tipo
  `https://quinoa.vercel.app`. Si usas otro hosting distinto a Vercel,
  actualiza `APP_BASE_URL` con esa misma dirección (Stripe la necesita para
  regresar al usuario después de pagar).
- **Para probar en tu misma red Wi-Fi sin publicar nada todavía:** ejecuta
  el servidor y entra desde el celular a `http://<IP-de-tu-computadora>:3000`
  (mismo Wi-Fi). Nota: Stripe Checkout funciona igual en `http://` para
  pruebas en red local, pero para cobros reales necesitas `https://`
  (Vercel y Render lo dan automáticamente y gratis).

Luego, en el celular:

- **Android (Chrome):** abre la dirección → menú (⋮) → "Agregar a pantalla
  de inicio" / "Instalar app".
- **iPhone (Safari):** abre la dirección → botón de compartir (□↑) → "Agregar
  a pantalla de inicio".

El ícono de Quinoa aparecerá como cualquier otra app, y se abrirá a pantalla
completa (sin la barra del navegador).

## 7. Cómo funciona el pedido y el pago

1. El cliente arma su carrito y llena su nombre, teléfono y si es para
   recoger en tienda o entrega a domicilio.
2. Al tocar "Pagar con tarjeta", la app crea una sesión segura de **Stripe
   Checkout** (una página hospedada por Stripe, no por ti) donde el cliente
   introduce los datos de su tarjeta. **Quinoa nunca ve ni guarda el número
   de tarjeta** — eso lo maneja Stripe, que es quien cumple con los
   estándares de seguridad (PCI) que un negocio pequeño no podría manejar
   por su cuenta.
3. Si el pago es exitoso, Stripe regresa al cliente a la página de
   confirmación de Quinoa, que verifica con Stripe que el pago sí se realizó
   antes de mostrar "Pedido confirmado".
4. Cada pedido pagado queda guardado. En tu computadora, en
   `server/data/orders.json` (se crea automáticamente). En Vercel, en la
   base de datos Redis que conectes (ver sección 11) — sin eso, los pedidos
   en Vercel solo viven en memoria y se pueden perder. Puedes consultar los
   pedidos abriendo `/api/orders` (por ejemplo
   `http://localhost:3000/api/orders`, o `https://tu-app.vercel.app/api/orders`
   una vez desplegada) — o pedirle a un desarrollador que te arme una
   pantalla de administración más adelante.

## 8. Antes de cobrar dinero real — lista de seguridad

- [ ] Cambia las claves de Stripe de `test` a `live`.
- [ ] Publica la app con `https://` (obligatorio para pagos reales).
- [ ] Considera activar un **webhook de Stripe** (Developers → Webhooks) que
      apunte a tu servidor para confirmar pagos incluso si el cliente cierra
      el navegador antes de volver a la página de éxito. La app ya confirma
      el pago consultando directamente a Stripe, así que esto es un extra de
      robustez, no algo obligatorio para empezar.
- [ ] El endpoint `/api/orders` no tiene contraseña — está pensado solo para
      revisarlo tú desde la misma computadora mientras pruebas. Si publicas
      la app en internet, pide que se le agregue un usuario/contraseña antes
      de usarlo en producción.
- [ ] Revisa las comisiones de Stripe por transacción (varían por país) en
      su página de precios antes de fijar tus precios finales.

## 9. Estructura del proyecto

```
quinoa-live app/
├── api/                 cada archivo = una dirección de la API en Vercel
│   ├── config.js         -> /api/config
│   ├── menu.js           -> /api/menu
│   ├── checkout.js       -> /api/checkout
│   ├── order-status.js   -> /api/order-status
│   ├── orders.js         -> /api/orders
│   └── storage-status.js -> /api/storage-status  (diagnóstico)
├── server/
│   ├── handlers.js      LA LÓGICA de la API — la usan tanto Vercel como
│   │                     el servidor local, para no duplicar código
│   ├── app.js            servidor Express, solo para tu computadora
│   ├── index.js           arranca ese servidor (npm start)
│   ├── store.js            guarda los pedidos (archivo local / Redis en Vercel)
│   ├── menu.js              el menú del restaurante (edítalo aquí)
│   └── data/orders.json      pedidos guardados en local (se crea solo)
├── public/               todo esto lo sirve Vercel como archivos estáticos
│   ├── index.html         pantalla principal (menú + carrito)
│   ├── success.html        pantalla de "pedido confirmado"
│   ├── cancel.html          pantalla de "pago cancelado"
│   ├── app.js               lógica del menú/carrito/checkout
│   ├── i18n.js               textos en inglés y español
│   ├── app-status.js          lógica de la pantalla de confirmación
│   ├── styles.css              estilos (colores, tema visual)
│   ├── manifest.json            configuración de instalación como app
│   ├── service-worker.js         hace la app instalable y más rápida
│   └── icons/                     íconos de la app
├── .env.example         plantilla de configuración (cópiala a .env)
├── start-quinoa.bat     arranca el servidor local con doble clic (Windows)
└── package.json
```

No hay `vercel.json`: Vercel convierte solo cada archivo de `api/` en una
función y sirve `public/` como sitio estático. Esa convención por archivos es
la más estable de la plataforma y no depende de ninguna configuración.

## 11. Desplegar en Vercel (para tener la app en internet)

Vercel corre tu app como "funciones serverless" (se prenden solo cuando
llega una petición) en vez de un servidor que está prendido todo el tiempo.
Este proyecto ya está preparado para eso (carpeta `api/`, archivo
`vercel.json`), pero hay un detalle importante: como las funciones no
guardan archivos de forma permanente, los pedidos NO se pueden seguir
guardando en `server/data/orders.json` como en tu computadora — para eso
sirve `server/store.js`, que cambia automáticamente a usar una base de
datos Redis cuando detecta que está corriendo en Vercel.

Pasos:

1. **Instala la CLI de Vercel** (una sola vez):
   ```
   npm install -g vercel
   ```
2. **Inicia sesión** (abre tu navegador para confirmar):
   ```
   vercel login
   ```
3. **Despliega**, parado en esta carpeta:
   ```
   vercel --prod
   ```
   La primera vez te va a preguntar el nombre del proyecto y algunas
   opciones — puedes aceptar las que te sugiere por default. Al terminar te
   da una dirección tipo `https://quinoa-xxxx.vercel.app` — esa ya funciona
   en internet, y puedes instalarla en tu celular igual que en la sección 6.

4. **Configura tus variables de entorno en Vercel** (los pagos no
   funcionarán hasta hacer esto): en [vercel.com](https://vercel.com) → tu
   proyecto → **Settings → Environment Variables**, agrega:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `BUSINESS_NAME` (opcional)

   No hace falta `APP_BASE_URL` — la app detecta sola la dirección de
   Vercel. Después de agregar variables, vuelve a desplegar con
   `vercel --prod` para que se apliquen.

5. **Conecta la base de datos para que los pedidos no se pierdan** (ver la
   sección 12, que lo explica paso a paso).

6. **Cada vez que cambies el código** (por ejemplo, el menú en
   `server/menu.js`), vuelve a correr `vercel --prod` para publicar los
   cambios.

## 12. Dónde se guardan los pedidos (y cómo conectar la base de datos)

Depende de dónde esté corriendo la app:

| Dónde corre | Dónde se guarda | ¿Se conserva? |
|---|---|---|
| Tu computadora (`npm start`) | `server/data/orders.json` | Sí |
| Vercel **con** Redis conectado | Base de datos Upstash | Sí |
| Vercel **sin** Redis | Solo en memoria | **No, se pierden** |

En Vercel la app corre como funciones que se prenden y se apagan solas, y su
disco se borra: por eso no se puede usar un archivo como base de datos y hace
falta conectar Redis.

### Cómo saber en qué estado estás

Abre esta dirección en tu app publicada:

```
https://tu-app.vercel.app/api/storage-status
```

Te responde algo así:

```json
{
  "storage": { "type": "redis", "ok": true, "envVar": "UPSTASH_REDIS_REST_URL",
               "detail": "Base de datos conectada y funcionando..." },
  "payments": { "ok": true, "detail": "Claves de Stripe configuradas..." },
  "readyToTakeOrders": true
}
```

Cuando `readyToTakeOrders` sea `true`, la app ya puede recibir y guardar
pedidos de verdad. Si algo está mal, el campo `detail` dice exactamente qué
falta. (Esta página no muestra ninguna clave ni contraseña.)

### Conectar Redis (Upstash), paso a paso

1. En [vercel.com](https://vercel.com), entra a tu proyecto.
2. Pestaña **Storage** → botón **Create Database** o **Browse Marketplace**.
3. Busca **Upstash** (aparece como "Upstash for Redis") y elígelo. Cualquier
   otra integración de Redis del Marketplace también sirve.
4. Elige el plan gratuito, dale un nombre y confirma que se conecte **a este
   proyecto**.
5. Vercel agrega solo las variables de entorno necesarias — no tienes que
   copiar ni pegar nada.
6. **Vuelve a desplegar** para que la app las tome: pestaña **Deployments** →
   menú (⋯) del último → **Redeploy**.
7. Abre `/api/storage-status` y confirma que diga `"type": "redis"` y
   `"ok": true`.

Nota: "Vercel KV", el almacenamiento propio que Vercel ofrecía antes, ya no
existe — lo reemplazaron por integraciones de terceros como Upstash, gratis
para volúmenes pequeños. El código ya está preparado y detecta las
credenciales aunque la integración las nombre de forma distinta.

### Cómo ver los pedidos

Por ahora, en `https://tu-app.vercel.app/api/orders` — una lista en formato
JSON, sin contraseña. Sirve para probar, **no para operar el negocio**: antes
de abrir al público conviene agregarle una pantalla con contraseña.

Mientras tanto, **Stripe te manda un correo por cada pago** y en su panel
puedes ver el detalle de cada pedido: los platillos aparecen como conceptos
de la compra, y el nombre, teléfono, tipo de pedido, dirección y notas van
guardados en los datos adicionales ("metadata") de cada pago.

## 13. Dudas frecuentes

**¿Por qué no una app "de verdad" en la Play Store / App Store?**
Se puede hacer más adelante — de hecho, este mismo proyecto se puede
empaquetar con herramientas como Capacitor para subirlo a las tiendas casi
sin cambios. Se eligió empezar como app web instalable porque se lanza hoy
mismo, sin esperar la revisión de Apple/Google ni pagar las cuotas de
desarrollador ($99/año Apple, $25 único pago Google).

**"Visa" no es un método de pago que pueda conectar directamente.**
Visa es la red de tarjetas (como Mastercard o Amex), no un proveedor con el
que un negocio se conecte directamente. Para aceptar tarjetas Visa (y las
demás) se necesita un procesador de pagos — aquí se usó **Stripe** porque es
el más simple de configurar y acepta Visa, Mastercard, Amex y más desde el
día uno.
