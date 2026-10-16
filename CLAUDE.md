# Proyecto Ventas — contexto para Claude

## Qué es
Plataforma multi-tienda de pedidos online. Cada negocio (tienda) tiene un `slug` y una página pública
(`/:slug`) donde los clientes ven productos por categoría, arman un carrito y envían un pedido
(nombre + teléfono, sin cuenta). Los dueños (`owner`/`admin`) inician sesión para gestionar productos
(`/:slug/products`) y pedidos (`/:slug/orders`). Al confirmar un pedido se envía un mensaje de WhatsApp
(hoy solo simulado en consola).

## Visión (decidida por el usuario el 2026-10-15)
**Una sola plataforma multi-tenant** (una instalación para todas las tiendas, no una por cliente) con
tres niveles de acceso:
- **Superadministrador** (el usuario, dueño del sistema): panel central para crear, configurar,
  suspender y supervisar todas las tiendas.
- **Administrador de tienda** (`owner`/`admin`): solo su tienda: catálogo, precios, pedidos, clientes y configuración.
- **Cliente final**: se registra e inicia sesión **en cada tienda**, compra y consulta sus pedidos.
Cada tienda tiene sus datos aislados (configuración, catálogo, pedidos, clientes).

## Decisiones de arquitectura
- **Aislamiento:** se mantiene una sola base de datos con `business_id` en cada tabla (ya existente).
  Toda consulta filtra por la tienda del token; el superadmin es el único que ve varias tiendas.
- **Roles en el token:** `superadmin` (sin `business_id`), `owner`/`admin` (staff de una tienda) y `customer`.
  Las rutas de gestión exigen rol de staff de esa tienda: hoy productos y categorías solo comprueban
  que haya token, así que **los roles van antes que las cuentas de cliente**.
- **Clientes:** tabla propia `customers` (`business_id`, email único **por tienda**), separada de `users`
  (personal), para que un mismo email pueda ser cliente de varias tiendas sin mezclar permisos.
- **Moneda:** `businesses.currency` (código ISO 4217: ARS, USD, EUR…) y `businesses.locale` (es-AR…).
  Se formatea con `Intl.NumberFormat` en una única función `formatPrice`; una moneda nueva no requiere
  cambios de código. Cada pedido guarda su `currency` para que cambiar la moneda de la tienda no altere
  pedidos antiguos. Precios en `DECIMAL`; las conversiones entre divisas quedan para el futuro.
- **Historial de pedidos:** cada línea guarda `product_name` y `options` (JSON); borrar un producto
  deja `product_id` en NULL y conserva la línea (hecho en la fase 6, migración 003).

## Hoja de ruta
Cada fase: cambios mínimos, ampliar `backend/tests/api.test.mjs`, probar en navegador, commit y push al fork.
- **Fase 6 — Pedidos correctos (hecha):** cantidades enteras 1–999, teléfono validado, total en céntimos,
  transacción al crear el pedido, `options` (cantidad de carnes en hamburguesas) y `product_name` en cada
  línea, historial que no se borra, JSON mal formado sin traza interna, carrito por tienda guardado en el navegador.
- **Fase 7 — Roles y superadmin (hecha):** rol `superadmin` (`business_id` NULL), `requireStaff` en todas
  las rutas de gestión de una tienda (comprueba en cada petición que la tienda no esté suspendida),
  `requireSuperadmin` en `/api/admin`; `businesses.is_active` (suspendida = oculta al público, sin pedidos
  ni acceso de su personal); panel `/admin` (listar, crear tienda + su administrador, suspender/reactivar);
  crear tienda ya no es público; script `backend/scripts/create-superadmin.js`; migración 004.
- **Fase 8 — Configuración por tienda (hecha):** `businesses.currency`/`locale` y `orders.currency`
  (migración 005); validación común en `backend/src/utils/businessSettings.js`; "Mi tienda"
  (`/:slug/settings`, API `/api/businesses/mine`) y "Configurar" en `/admin` (API `PUT /api/admin/businesses/:id`,
  también cambia el tipo) con el mismo `StoreSettingsForm`; `formatPrice` en catálogo, carrito, checkout,
  pedidos, gestión y WhatsApp; color de marca y logo en la cabecera; gestión de categorías (`CategoryManager`).
- **Fase 9 — Clientes finales (hecha):** tabla `customers` (email único por tienda) y `orders.customer_id`
  (migración 006). API: `POST /api/store/:slug/customers/register|login`, `GET .../customers/me/orders`
  (`requireCustomer`), `GET /api/customers` (personal). Token de cliente: `role: "customer"`, sin acceso a
  gestión. El checkout sigue abierto sin cuenta (`optionalAuth`); con sesión, el pedido se vincula.
  Frontend: `CustomerContext` (sesión por tienda en `customer:<slug>`), páginas `/:slug/cuenta`,
  `/:slug/mis-pedidos` y `/:slug/clientes`; el acceso del personal sigue en `/login`.
- **Fase 10 — Tienda configurable por tipo (hecha):** `frontend/src/config/catalog.js` define los tipos
  de tienda (cómo se muestran las categorías) y de producto (icono, nombre, opciones). Una sola página
  `Store.jsx` (pestañas o lista lateral) y una sola `ProductCard.jsx` (opciones solo si el tipo de producto
  las tiene). Eliminados `StoreBurger`, `BurgerProductCard`, `BurgerProductList`, `BurgerCategoryTabs`;
  `/:slug/burger` redirige a `/:slug`. Tienda inexistente muestra un mensaje.
- **Modo oscuro y estadísticas (hechos, fuera de la numeración):** ver "Modo oscuro" y "Estadísticas" abajo.
- **Fase 11 — WhatsApp real (pospuesta por el usuario):** al confirmar el cliente el pedido, aviso a la
  tienda y confirmación al cliente con artículos, cantidades y total en su moneda; tabla de notificaciones
  con estado de envío visible en el panel; número receptor configurable por tienda; API de WhatsApp
  Business u otro proveedor compatible.
- **Fase 12 — Producción (pospuesta por el usuario):** docker-compose de producción, secretos, CORS, límite de intentos de login y de
  pedidos, esquema separado de los datos de ejemplo, script del primer superadmin, cambio de la contraseña antigua.

## Tecnologías
- **Backend:** Node 18, Express 5, mysql2 (pool con promesas), JWT (`jsonwebtoken`), `bcryptjs`. CommonJS.
  Estructura: `backend/src/{routes,controllers,middlewares,services,config}`. Sin ORM: SQL con parámetros `?`.
- **Frontend:** React 19 + Vite 5 + React Router 7 + Tailwind. Estado en `context/AuthContext` y `context/CartContext`.
- **Base de datos:** MySQL 8, esquema y datos de ejemplo en `init.sql` (solo se aplica con un volumen vacío);
  cambios para bases existentes en `scripts/migrations/` (numerados, se aplican en orden una sola vez).
- **Entorno:** `docker-compose.yml` (backend :3001, frontend :5173, MySQL :3307, phpMyAdmin :8080).

## Reglas del proyecto
- Toda consulta que lea o modifique datos de un negocio debe filtrar por el `businessId` del token
  (`req.user.businessId`), nunca solo por el `slug` de la URL ni por datos del cliente.
- Nunca confiar en `role`, precios ni totales enviados por el cliente; el precio se toma de la BD.
- Toda ruta nueva de gestión de una tienda lleva `authMiddleware, authMiddleware.requireStaff`; las del
  panel de plataforma van en `admin.routes.js` (protegidas con `requireSuperadmin`).
- Las consultas públicas solo devuelven tiendas con `is_active = TRUE`.
- Slugs reservados (no pueden ser tiendas): `admin`, `login`, `api` (`admin.controller.js`).
- SQL siempre parametrizado. No exponer detalles de errores internos al cliente.
- Secretos solo en variables de entorno, nunca en el repositorio.
- La URL del backend en el frontend sale de `import.meta.env.VITE_API_URL`; no escribir `http://localhost:3001` a mano.
- Mantener la estructura actual (rutas → controladores). No añadir capas, ORMs ni dependencias sin una razón concreta.
- Cambio de esquema = actualizar `init.sql` **y** añadir una migración en `scripts/migrations/` (y el README).

## Funcionalidades que no deben romperse
Listado de tiendas, página pública de tienda (pestañas o lista lateral según el tipo), carrito y checkout, login de dueños y del
superadmin, panel `/admin` (crear y suspender tiendas), gestión de productos, gestión de pedidos con cambio de estado,
cuenta de cliente por tienda (registro, login, Mis pedidos) y compra sin cuenta, lista de clientes,
estadísticas de la tienda, modo oscuro.

## Metodología de trabajo
Seguir el flujo: analizar → planificar → implementar lo mínimo → verificar → revisar → documentar.
Al terminar una tarea, informar en español: qué se resolvió, qué cambió y dónde, por qué, qué pruebas
se hicieron y sus resultados, qué se revisó de seguridad, dependencias nuevas y riesgos pendientes.

## Problemas conocidos
Ya corregidos: `.env` versionado, registro con rol del cliente, pedidos sin comprobar la tienda,
`VITE_API_URL` indefinida en Docker, crear/editar productos, URLs escritas a mano, login al recargar,
mensaje de producto, rutas de imágenes, y lo de las fases 6 y 7.
Eliminadas en la fase 7: páginas `Home` (`/home`) y `CreateBusiness` (`/register`, `/create-business`).
Limpieza hecha: `node_modules` y `package.json` de la raíz, componentes y scripts sin uso.
`backend/qrys db/` son scripts de datos de trabajo de Fran (no código de la app): no borrar.
Pendientes:
1. **Antes de salir de local / producción:** el historial de Git conserva el `backend/.env` antiguo;
   cambiar esa contraseña donde se use y no reutilizarla. Pospuesto a propósito mientras se prueba en local.
2. `npx eslint` marca `react-refresh/only-export-components` en `AuthContext.jsx`, `CartContext.jsx` y `CustomerContext.jsx`
   (exportan el contexto junto al componente); no afecta al funcionamiento.

## Tipos de tienda y producto
- **Rubro nuevo con el mismo diseño:** solo datos (crear la tienda con un tipo existente y sus productos).
- **Tipo de producto nuevo** (icono y nombre): una entrada en `PRODUCT_TYPES` de `config/catalog.js`.
- **Tipo de tienda nuevo:** entrada en `STORE_TYPES` de `config/catalog.js`, en `STORE_TYPES` de
  `backend/src/utils/businessSettings.js` y en el ENUM de `businesses.type` (init.sql + migración).
- **Opción de producto nueva** (como `meatCount`): hoy el carrito (`CartContext`) y `orders.controller.js`
  solo conocen `meatCount`; una opción distinta necesita soporte en los dos y en `describeOptions`.

## Sesión y carrito en el frontend
`AuthContext` lee `user` de `localStorage` al crearse (sin estado `loading`). Las páginas protegidas que
reciben 401 de la API llaman a `logout()`, y su efecto las redirige al login.
El carrito es por tienda: `StoreHeader` llama a `selectStore(slug)` y `CartContext` guarda cada carrito en
`localStorage` con la clave `cart:<slug>`.

## Moneda y marca en el frontend
- Importes: siempre `formatPrice(importe, tienda)` de `src/utils/money.js` (nunca "$" a mano). La tienda
  (`currency`, `locale`) llega como prop `business` desde la página; un pedido usa su propia `currency`.
- Color de marca: `StoreLayout` define `--brand` con `businesses.primary_color`; usar `bg-[var(--brand)]`,
  `text-[var(--brand)]`, etc.

## Modo oscuro
- Clase `dark` en `<html>`: la aplica `index.html` antes de cargar (preferencia guardada o la del sistema)
  y la cambia `ThemeToggle` (`src/utils/theme.js`, clave `theme` en localStorage).
- `src/index.css` reasigna en oscuro los colores neutros que usa la app (`bg-white`, `bg-gray-50/100/300`,
  `text-gray-400…900`, bordes, formularios). Usar esos colores neutros en componentes nuevos y se
  adaptan solos; para otro color neutro, añadir su regla allí (o usar `dark:` de Tailwind, `darkMode: "class"`).

## Estadísticas
- `GET /api/stats?days=7|30|90` (personal de la tienda), página `/:slug/estadisticas` (portada del dueño tras el login).
- Los días se cuentan en `businesses.timezone` (IANA, migración 007, editable en "Mi tienda"); el
  agrupado por día se hace en `stats.controller.js` con `Intl`.
- Solo suman pedidos no cancelados en la moneda actual de la tienda; los de otra moneda se avisan aparte.
- Gráficos: color `--chart-series-1` (claro `#2a78d6`, oscuro `#3987e5`, validados con la guía dataviz),
  no el color de marca (que elige la tienda y puede no contrastar). Siempre con detalle al pasar el ratón
  y versión en tabla.

## Pruebas
`backend/tests/api.test.mjs` (sin dependencias): con `docker compose up -d`, ejecutar `npm test` en `backend/`.
Ejecutarlas después de cada cambio. Al añadir una funcionalidad, añadir sus casos, incluido siempre
"usuario de otra tienda".

## Imágenes
El backend sirve `backend/images/` en `/api/images/`; la BD guarda rutas `/api/images/...` (o una URL `https://`).
En el frontend, usar siempre `getImageUrl()` y `onError={showPlaceholderOnError}` de `src/utils/images.js`.
Casi todas las imágenes de los datos de ejemplo no existen como archivo: se ve `frontend/public/images/placeholder.svg`.
