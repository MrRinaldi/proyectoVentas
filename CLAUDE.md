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
1. `backend/.env` con contraseña real y `JWT_SECRET` subido a un repositorio público.
2. `POST /api/auth/register` acepta `role` del cliente → cualquiera puede hacerse dueño de cualquier tienda.
3. Pedidos (`GET/PUT /api/store/:slug/orders`) no comprueban que el usuario sea de esa tienda.
4. `updateProduct` usa `image_medium` sin definir → editar productos siempre falla.
5. `createProduct` inserta `product_type`, columna que no existe en `init.sql`.
6. `frontend/.env` no está en el repositorio → `VITE_API_URL` indefinida en una instalación limpia.
7. `node_modules/` de la raíz versionado (2068 archivos) y `package.json` raíz con una dependencia sin uso.
