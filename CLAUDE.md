# Proyecto Ventas — contexto para Claude

## Qué es
Plataforma multi-tienda de pedidos online. Cada negocio (tienda) tiene un `slug` y una página pública
(`/:slug`) donde los clientes ven productos por categoría, arman un carrito y envían un pedido
(nombre + teléfono, sin cuenta). Los dueños (`owner`/`admin`) inician sesión para gestionar productos
(`/:slug/products`) y pedidos (`/:slug/orders`). Al confirmar un pedido se envía un mensaje de WhatsApp
(hoy solo simulado en consola).

## Tecnologías
- **Backend:** Node 18, Express 5, mysql2 (pool con promesas), JWT (`jsonwebtoken`), `bcryptjs`. CommonJS.
  Estructura: `backend/src/{routes,controllers,middlewares,services,config}`. Sin ORM: SQL con parámetros `?`.
- **Frontend:** React 19 + Vite 5 + React Router 7 + Tailwind. Estado en `context/AuthContext` y `context/CartContext`.
- **Base de datos:** MySQL 8, esquema y datos de ejemplo en `init.sql` (solo se aplica con un volumen vacío).
- **Entorno:** `docker-compose.yml` (backend :3001, frontend :5173, MySQL :3307, phpMyAdmin :8080).

## Reglas del proyecto
- Toda consulta que lea o modifique datos de un negocio debe filtrar por el `businessId` del token
  (`req.user.businessId`), nunca solo por el `slug` de la URL ni por datos del cliente.
- Nunca confiar en `role`, precios ni totales enviados por el cliente; el precio se toma de la BD.
- SQL siempre parametrizado. No exponer detalles de errores internos al cliente.
- Secretos solo en variables de entorno, nunca en el repositorio.
- La URL del backend en el frontend sale de `import.meta.env.VITE_API_URL`; no escribir `http://localhost:3001` a mano.
- Mantener la estructura actual (rutas → controladores). No añadir capas, ORMs ni dependencias sin una razón concreta.

## Funcionalidades que no deben romperse
Listado de tiendas, página pública de tienda y variante burger, carrito y checkout, login de dueños,
crear tienda, gestión de productos, gestión de pedidos con cambio de estado.

## Metodología de trabajo
Seguir el flujo: analizar → planificar → implementar lo mínimo → verificar → revisar → documentar.
Al terminar una tarea, informar en español: qué se resolvió, qué cambió y dónde, por qué, qué pruebas
se hicieron y sus resultados, qué se revisó de seguridad, dependencias nuevas y riesgos pendientes.

## Problemas conocidos (análisis del 2026-10-15, pendientes de corregir)
Ya corregidos: `.env` versionado, registro con rol del cliente, pedidos sin comprobar la tienda,
`VITE_API_URL` indefinida en Docker, crear/editar productos (columna `product_type`, ver `scripts/migrations`),
URLs `localhost:3001` escritas a mano, login al recargar páginas protegidas, mensaje de producto,
rutas de imágenes (migración 002).
Limpieza hecha: `node_modules` y `package.json` de la raíz, componentes y scripts sin uso.
`backend/qrys db/` son scripts de datos de trabajo de Fran (no código de la app): no borrar.
Pendientes:
1. **Antes de salir de local / producción:** el historial de Git conserva el `backend/.env` antiguo;
   cambiar esa contraseña donde se use y no reutilizarla. Pospuesto a propósito mientras se prueba en local.
2. `npx eslint` marca `react-refresh/only-export-components` en `AuthContext.jsx` (exporta `useAuth`); no afecta al funcionamiento.

## Sesión en el frontend
`AuthContext` lee `user` de `localStorage` al crearse (sin estado `loading`). Las páginas protegidas que
reciben 401 de la API llaman a `logout()`, y su efecto las redirige al login.

## Pruebas
`backend/tests/api.test.mjs` (sin dependencias): con `docker compose up -d`, ejecutar `npm test` en `backend/`.
Ejecutarlas después de cada cambio. Al añadir una funcionalidad, añadir sus casos, incluido siempre
"usuario de otra tienda".

## Próximo paso: verificación general como aplicación base
Pendiente (pedido por el usuario el 2026-10-15). La app será una **base que se adapta a cada cliente**,
así que la revisión debe evaluar, además de errores y seguridad:
- Qué cambia por cliente (nombre, colores, logo, tipo de tienda, textos, moneda) y si se configura en un
  solo sitio o está repartido por el código; `businesses.primary_color` y `type` existen pero casi no se usan.
- Variantes de tienda (`Store` y `StoreBurger`, `ProductCard` y `BurgerProductCard`): duplicación y cómo
  añadir un tipo nuevo sin copiar componentes.
- Flujos completos en el navegador (cliente y dueño), incluido móvil.
- Configuración y despliegue (variables de entorno, Docker, migraciones) para instalar a un cliente nuevo.
Resultado esperado: informe con hallazgos priorizados y propuesta de fases, antes de cambiar código.

## Imágenes
El backend sirve `backend/images/` en `/api/images/`; la BD guarda rutas `/api/images/...` (o una URL `https://`).
En el frontend, usar siempre `getImageUrl()` y `onError={showPlaceholderOnError}` de `src/utils/images.js`.
Casi todas las imágenes de los datos de ejemplo no existen como archivo: se ve `frontend/public/images/placeholder.svg`.
