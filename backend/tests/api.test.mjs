// Pruebas de la API contra la aplicación levantada con docker compose y los datos de init.sql.
// Uso (desde backend/): npm test      Otra URL: API_URL=http://otro:3001 npm test
// Modifican datos de prueba (crean pedidos y cambian el estado del pedido 3): usar solo en desarrollo.
import crypto from "node:crypto";

const API = process.env.API_URL || "http://localhost:3001";
// Secreto distinto del del servidor: simula un token falsificado por un atacante.
const attackerSecret = crypto.randomBytes(32).toString("hex");
const results = [];

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

// JWT HS256 firmado a mano con un secreto que no es el del servidor.
function forgeToken(secret, payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ ...payload, iat: Math.floor(Date.now() / 1000) });
  const sig = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

// --- Público
let r = await call("GET", "/api/businesses");
const seedSlugs = ["la-tienda-del-barrio", "comidas-don-jorge", "perfumeria-elegancia"];
check("Lista de tiendas", r.status === 200 && seedSlugs.every((s) => r.data.businesses?.some((b) => b.slug === s)), `status ${r.status}, ${r.data?.businesses?.length} tiendas`);

r = await call("GET", "/api/store/la-tienda-del-barrio");
check("Página de una tienda", r.status === 200 && r.data.products?.length > 0, `status ${r.status}, ${r.data?.products?.length} productos`);

// --- Login
r = await call("POST", "/api/auth/login", { body: { email: "owner@tienda.com", password: "password123" } });
const token = r.data?.token;
check("Login correcto", r.status === 200 && !!token, `status ${r.status}`);

const wrongPass = await call("POST", "/api/auth/login", { body: { email: "owner@tienda.com", password: "mala" } });
const noUser = await call("POST", "/api/auth/login", { body: { email: "nadie@x.com", password: "mala" } });
check("Login fallido no revela si el email existe",
  wrongPass.status === 401 && noUser.status === 401 && wrongPass.data.message === noUser.data.message,
  `${wrongPass.status} "${wrongPass.data?.message}" / ${noUser.status} "${noUser.data?.message}"`);

// --- Registro eliminado
r = await call("POST", "/api/auth/register", { body: { businessSlug: "comidas-don-jorge", email: "atacante@x.com", password: "123456", role: "owner" } });
check("Registro con rol elegido ya no existe", r.status === 404, `status ${r.status}`);

// --- Pedidos
r = await call("GET", "/api/store/la-tienda-del-barrio/orders", { token });
check("Dueño ve pedidos de su tienda", r.status === 200 && r.data.orders?.length > 0, `status ${r.status}, ${r.data?.orders?.length} pedidos`);

r = await call("GET", "/api/store/comidas-don-jorge/orders", { token });
check("Dueño NO ve pedidos de otra tienda", r.status === 403, `status ${r.status}`);

r = await call("PUT", "/api/store/comidas-don-jorge/orders/4/status", { token, body: { status: "cancelled" } });
check("Dueño NO cambia pedidos de otra tienda", r.status === 403, `status ${r.status}`);

r = await call("PUT", "/api/store/la-tienda-del-barrio/orders/3/status", { token, body: { status: "confirmed" } });
check("Dueño cambia estado de su pedido", r.status === 200, `status ${r.status}`);

r = await call("GET", "/api/store/la-tienda-del-barrio/orders");
check("Pedidos sin sesión rechazados", r.status === 401, `status ${r.status}`);

// --- Checkout público (el precio sale de la BD, no del cliente)
r = await call("POST", "/api/store/la-tienda-del-barrio/orders", {
  body: { customerName: "Prueba", customerPhone: "+34600000000", items: [{ productId: 1, quantity: 2, price: 0.01 }] },
});
check("Crear pedido (checkout)", r.status === 201 && Number(r.data.order?.total) === 5, `status ${r.status}, total ${r.data?.order?.total}`);

// --- Pedidos: validación, redondeo, opciones e historial
const order = (slug, items, extra = {}) =>
  call("POST", `/api/store/${slug}/orders`, { body: { customerName: "Prueba", customerPhone: "+54 11 5555-1234", items, ...extra } });

r = await order("la-tienda-del-barrio", [{ productId: 1, quantity: 0.4 }]);
check("Cantidad con decimales rechazada", r.status === 400, `status ${r.status}`);

r = await order("la-tienda-del-barrio", [{ productId: 1, quantity: "2" }]);
check("Cantidad como texto rechazada", r.status === 400, `status ${r.status}`);

r = await order("la-tienda-del-barrio", [{ productId: 1, quantity: 1 }], { customerPhone: "abc" });
check("Teléfono no válido rechazado", r.status === 400, `status ${r.status} ${r.data?.message ?? ""}`);

r = await order("la-tienda-del-barrio", [{ productId: 4, quantity: 3 }]);
check("Total sin errores de redondeo (1.45 x 3)", r.status === 201 && r.data.order.total === 4.35, `total ${r.data?.order?.total}`);

const rawRes = await fetch(`${API}/api/store/la-tienda-del-barrio/orders`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: "{mal json",
});
const rawText = await rawRes.text();
check("JSON mal formado: 400 sin traza interna", rawRes.status === 400 && !rawText.includes("at "), `status ${rawRes.status} ${rawText.slice(0, 60)}`);

r = await order("comidas-don-jorge", [{ productId: 10, quantity: 1, meatCount: 2 }, { productId: 12, quantity: 1, meatCount: 3 }]);
const burgerOrderId = r.data?.order?.id;
const jorgeToken = (await call("POST", "/api/auth/login", { body: { email: "owner@comidas.com", password: "password123" } })).data?.token;
const jorgeOrders = (await call("GET", "/api/store/comidas-don-jorge/orders", { token: jorgeToken })).data?.orders || [];
const burgerOrder = jorgeOrders.find((o) => o.id === burgerOrderId);
const burgerLine = burgerOrder?.items.find((i) => i.product_name === "Hamburguesa Clásica");
const pizzaLine = burgerOrder?.items.find((i) => i.product_name === "Pizza Margarita");
check("Cantidad de carnes guardada en hamburguesas", burgerLine?.options?.meatCount === 2, JSON.stringify(burgerLine?.options));
check("Cantidad de carnes ignorada en otros productos", pizzaLine && pizzaLine.options === null, JSON.stringify(pizzaLine?.options));

await call("POST", "/api/products", { token, body: { name: "Producto temporal", price: 3, is_active: true } });
const temp = (await call("GET", "/api/products", { token })).data.find((p) => p.name === "Producto temporal");
const tempOrderId = (await order("la-tienda-del-barrio", [{ productId: temp.id, quantity: 2 }])).data?.order?.id;
await call("DELETE", `/api/products/${temp.id}`, { token });
const tempOrder = (await call("GET", "/api/store/la-tienda-del-barrio/orders", { token })).data?.orders.find((o) => o.id === tempOrderId);
check("Borrar un producto no borra su historial", tempOrder?.items[0]?.product_name === "Producto temporal" && tempOrder.items[0].quantity === 2,
  JSON.stringify(tempOrder?.items[0]));

// --- Token falsificado con el secreto filtrado
{
  const forged = forgeToken(attackerSecret, { userId: 1, businessId: 2, role: "owner", businessSlug: "comidas-don-jorge" });
  r = await call("GET", "/api/store/comidas-don-jorge/orders", { token: forged });
  check("Token firmado con otro secreto rechazado", r.status === 401, `status ${r.status}`);
}

// --- Productos
const findProduct = async (pred) => (await call("GET", "/api/products", { token })).data.find(pred);

r = await call("POST", "/api/products", { token, body: { name: "Hamburguesa prueba", price: 7.5, category_id: 1, product_type: "burger", is_active: true } });
const created = await findProduct((p) => p.name === "Hamburguesa prueba");
check("Crear producto (con product_type)", r.status === 201 && created?.product_type === "burger", `status ${r.status}, product_type ${created?.product_type}`);

const before = await findProduct((p) => p.id === 1);
r = await call("PUT", "/api/products/1", { token, body: { name: "Manzanas Rojas", description: "Editada", price: 2.75, category_id: 1, image: before.image, product_type: "", is_active: false } });
const after = await findProduct((p) => p.id === 1);
check("Editar producto", r.status === 200 && Number(after.price) === 2.75 && after.description === "Editada" && !after.is_active, `status ${r.status}, precio ${after?.price}, activo ${after?.is_active}`);
check("Editar no borra image_medium", after.image_medium === before.image_medium && !!before.image_medium, `${before.image_medium} -> ${after.image_medium}`);
await call("PUT", "/api/products/1", { token, body: { name: "Manzanas Rojas", description: before.description, price: 2.5, category_id: 1, image: before.image, is_active: true } });

r = await call("POST", "/api/products", { token, body: { name: "Negativo", price: -3 } });
check("Precio negativo rechazado", r.status === 400, `status ${r.status} ${r.data?.message ?? ""}`);

r = await call("POST", "/api/products", { token, body: { name: "Categoría ajena", price: 3, category_id: 5 } });
check("Categoría de otra tienda rechazada", r.status === 400, `status ${r.status} ${r.data?.message ?? ""}`);

r = await call("PUT", "/api/products/10", { token, body: { name: "Hackeada", price: 1 } });
check("No se edita producto de otra tienda", r.status === 404, `status ${r.status}`);

if (created) {
  r = await call("DELETE", `/api/products/${created.id}`, { token });
  check("Eliminar producto", r.status === 200, `status ${r.status}`);
}

// --- Superadministrador y tiendas (fase 7). Crea una tienda nueva en cada ejecución.
r = await call("POST", "/api/auth/login", { body: { email: "admin@plataforma.com", password: "password123" } });
const superToken = r.data?.token;
check("Login del superadministrador", r.status === 200 && r.data.user?.role === "superadmin", `status ${r.status}, rol ${r.data?.user?.role}`);

r = await call("GET", "/api/admin/businesses", { token: superToken });
check("Superadmin ve todas las tiendas", r.status === 200 && r.data.businesses?.length >= 3, `status ${r.status}, ${r.data?.businesses?.length} tiendas`);

r = await call("GET", "/api/admin/businesses", { token });
check("Dueño de tienda NO entra al panel", r.status === 403, `status ${r.status}`);

r = await call("GET", "/api/admin/businesses");
check("Panel sin sesión rechazado", r.status === 401, `status ${r.status}`);

r = await call("POST", "/api/products", { token: superToken, body: { name: "Intruso", price: 1 } });
check("Superadmin no usa rutas de gestión de una tienda", r.status === 403, `status ${r.status}`);

r = await call("POST", "/api/auth/create-business", { body: { businessName: "Pública", email: "x@x.com", password: "12345678" } });
check("Crear tienda ya no es público", r.status === 404, `status ${r.status}`);

const stamp = Date.now();
const newStore = { businessName: `Tienda Prueba ${stamp}`, type: "food", ownerEmail: `dueno${stamp}@prueba.com`, ownerPassword: "clave-segura-1" };
r = await call("POST", "/api/admin/businesses", { token: superToken, body: newStore });
const newSlug = r.data?.business?.slug;
check("Superadmin crea tienda con su administrador", r.status === 201 && newSlug === `tienda-prueba-${stamp}`, `status ${r.status}, slug ${newSlug}`);

r = await call("POST", "/api/admin/businesses", { token: superToken, body: newStore });
check("Tienda duplicada rechazada", r.status === 409, `status ${r.status}`);

r = await call("POST", "/api/admin/businesses", { token: superToken, body: { ...newStore, businessName: "Admin", ownerEmail: `otro${stamp}@prueba.com` } });
check("Nombre reservado rechazado", r.status === 400, `status ${r.status} ${r.data?.message ?? ""}`);

r = await call("POST", "/api/admin/businesses", { token: superToken, body: { ...newStore, businessName: `Otra ${stamp}`, ownerEmail: `otro${stamp}@prueba.com`, ownerPassword: "corta" } });
check("Contraseña corta rechazada", r.status === 400, `status ${r.status}`);

r = await call("POST", "/api/auth/login", { body: { email: newStore.ownerEmail, password: newStore.ownerPassword } });
const newOwnerToken = r.data?.token;
check("El nuevo administrador inicia sesión en su tienda", r.status === 200 && r.data.user?.businessSlug === newSlug, `status ${r.status}`);

const newBusinessId = (await call("GET", "/api/admin/businesses", { token: superToken })).data.businesses.find((b) => b.slug === newSlug)?.id;
r = await call("PATCH", `/api/admin/businesses/${newBusinessId}/status`, { token: superToken, body: { isActive: false } });
check("Superadmin suspende la tienda", r.status === 200, `status ${r.status}`);

r = await call("GET", `/api/store/${newSlug}`);
const hiddenInList = !(await call("GET", "/api/businesses")).data.businesses.some((b) => b.slug === newSlug);
check("Tienda suspendida oculta al público", r.status === 404 && hiddenInList, `status ${r.status}, oculta en lista: ${hiddenInList}`);

r = await call("GET", "/api/products", { token: newOwnerToken });
check("Suspensión inmediata: el token del dueño deja de servir", r.status === 403, `status ${r.status}`);

r = await call("POST", "/api/auth/login", { body: { email: newStore.ownerEmail, password: newStore.ownerPassword } });
check("Dueño de tienda suspendida no puede iniciar sesión", r.status === 403, `status ${r.status}`);

r = await call("PATCH", `/api/admin/businesses/${newBusinessId}/status`, { token: superToken, body: { isActive: true } });
const visibleAgain = (await call("GET", `/api/store/${newSlug}`)).status === 200;
check("Superadmin reactiva la tienda", r.status === 200 && visibleAgain, `status ${r.status}, visible: ${visibleAgain}`);

// --- Configuración por tienda y categorías (fase 8)
const original = (await call("GET", "/api/businesses/mine", { token })).data?.business;
check("Mi tienda: el administrador ve su configuración", !!original?.currency && original.slug === "la-tienda-del-barrio", `${original?.currency} ${original?.locale}`);

// Valores tal como los envía el formulario (camelCase).
const settingsOf = (b) => ({
  name: b.name, logo: b.logo, primaryColor: b.primary_color, whatsappNumber: b.whatsapp_number,
  phone: b.phone, currency: b.currency, locale: b.locale, timezone: b.timezone, type: b.type,
});

r = await call("PUT", "/api/businesses/mine", { token, body: { ...settingsOf(original), currency: "USD", locale: "en-US", primaryColor: "#123456", type: "perfumery" } });
const store = (await call("GET", "/api/store/la-tienda-del-barrio")).data?.business;
check("Mi tienda: cambiar moneda, idioma y color", r.status === 200 && store?.currency === "USD" && store.locale === "en-US" && store.primary_color === "#123456",
  `status ${r.status}, ${store?.currency} ${store?.locale} ${store?.primary_color}`);
check("El administrador de la tienda no cambia su tipo", store?.type === original.type, `tipo ${store?.type}`);

r = await order("la-tienda-del-barrio", [{ productId: 1, quantity: 1 }]);
const usdOrderId = r.data?.order?.id;
check("El pedido guarda la moneda de la tienda", r.data?.order?.currency === "USD", `moneda ${r.data?.order?.currency}`);

for (const [label, change] of [["moneda inexistente", { currency: "QQQ" }], ["color no válido", { primaryColor: "rojo" }],
  ["logo no válido", { logo: "javascript:alert(1)" }], ["idioma no válido", { locale: "no válido!" }]]) {
  r = await call("PUT", "/api/businesses/mine", { token, body: { ...settingsOf(original), ...change } });
  check(`Mi tienda: ${label} rechazado`, r.status === 400, `status ${r.status} ${r.data?.message ?? ""}`);
}

r = await call("PUT", "/api/businesses/mine", { token: superToken, body: settingsOf(original) });
check("Superadmin no usa Mi tienda (no tiene tienda)", r.status === 403, `status ${r.status}`);

r = await call("PUT", "/api/businesses/mine", { token, body: settingsOf(original) });
const oldOrder = (await call("GET", "/api/store/la-tienda-del-barrio/orders", { token })).data?.orders.find((o) => o.id === usdOrderId);
check("Cambiar la moneda no altera pedidos anteriores", r.status === 200 && oldOrder?.currency === "USD", `pedido ${oldOrder?.currency}`);

const barrioId = (await call("GET", "/api/admin/businesses", { token: superToken })).data.businesses.find((b) => b.slug === "la-tienda-del-barrio").id;
r = await call("PUT", `/api/admin/businesses/${barrioId}`, { token: superToken, body: { ...settingsOf(original), type: "food" } });
const typeChanged = (await call("GET", "/api/store/la-tienda-del-barrio")).data?.business?.type === "food";
await call("PUT", `/api/admin/businesses/${barrioId}`, { token: superToken, body: settingsOf(original) });
check("Superadmin configura una tienda (incluido el tipo)", r.status === 200 && typeChanged, `status ${r.status}`);

r = await call("PUT", `/api/admin/businesses/${barrioId}`, { token, body: settingsOf(original) });
check("Administrador de tienda no usa la configuración del panel", r.status === 403, `status ${r.status}`);

r = await call("POST", "/api/categories", { token, body: { name: "  Categoría temporal  " } });
const tempCategoryId = r.data?.category?.id;
check("Crear categoría", r.status === 201 && r.data.category?.name === "Categoría temporal", `status ${r.status}`);

r = await call("POST", "/api/categories", { token, body: { name: "   " } });
check("Categoría sin nombre rechazada", r.status === 400, `status ${r.status}`);

r = await call("PUT", "/api/categories/5", { token, body: { name: "Hackeada" } });
const r2 = await call("DELETE", "/api/categories/5", { token });
check("No se modifica ni borra una categoría de otra tienda", r.status === 404 && r2.status === 404, `${r.status} / ${r2.status}`);

r = await call("PUT", `/api/categories/${tempCategoryId}`, { token, body: { name: "Categoría renombrada" } });
check("Renombrar categoría", r.status === 200, `status ${r.status}`);

await call("POST", "/api/products", { token, body: { name: "Producto en categoría temporal", price: 2, category_id: tempCategoryId } });
r = await call("DELETE", `/api/categories/${tempCategoryId}`, { token });
const orphan = (await call("GET", "/api/products", { token })).data.find((p) => p.name === "Producto en categoría temporal");
check("Borrar categoría deja sus productos sin categoría", r.status === 200 && orphan && orphan.category_id === null, `status ${r.status}, category_id ${orphan?.category_id}`);
if (orphan) await call("DELETE", `/api/products/${orphan.id}`, { token });

// --- Clientes finales (fase 9). Crea cuentas nuevas en cada ejecución.
const customerEmail = `cliente${stamp}@prueba.com`;
const newCustomer = { name: "Cliente Prueba", email: customerEmail, phone: "+54 11 5555-7777", password: "clave-cliente-1" };

r = await call("POST", "/api/store/la-tienda-del-barrio/customers/register", { body: newCustomer });
const customerToken = r.data?.token;
check("Cliente se registra en una tienda", r.status === 201 && !!customerToken && r.data.customer?.email === customerEmail, `status ${r.status}`);

r = await call("POST", "/api/store/la-tienda-del-barrio/customers/register", { body: newCustomer });
check("Email repetido en la misma tienda rechazado", r.status === 409, `status ${r.status}`);

r = await call("POST", "/api/store/comidas-don-jorge/customers/register", { body: { ...newCustomer, password: "otra-clave-22" } });
const jorgeCustomerToken = r.data?.token;
check("El mismo email puede ser cliente de otra tienda", r.status === 201, `status ${r.status}`);

r = await call("POST", "/api/store/la-tienda-del-barrio/customers/register", { body: { ...newCustomer, email: `x${stamp}@prueba.com`, password: "corta" } });
const r3 = await call("POST", "/api/store/la-tienda-del-barrio/customers/register", { body: { ...newCustomer, email: `y${stamp}@prueba.com`, phone: "abc" } });
check("Registro con contraseña corta o teléfono no válido rechazado", r.status === 400 && r3.status === 400, `${r.status} / ${r3.status}`);

r = await call("POST", "/api/store/la-tienda-del-barrio/customers/login", { body: { email: customerEmail, password: newCustomer.password } });
const loginOther = await call("POST", "/api/store/la-tienda-del-barrio/customers/login", { body: { email: customerEmail, password: "otra-clave-22" } });
check("Login de cliente con la contraseña de su tienda (y no la de otra)", r.status === 200 && loginOther.status === 401, `${r.status} / ${loginOther.status}`);

const staffRoutes = [["GET", "/api/products"], ["GET", "/api/categories"], ["GET", "/api/customers"],
  ["GET", "/api/store/la-tienda-del-barrio/orders"], ["GET", "/api/businesses/mine"], ["GET", "/api/admin/businesses"]];
const staffStatuses = [];
for (const [method, path] of staffRoutes) staffStatuses.push((await call(method, path, { token: customerToken })).status);
check("Un cliente no accede a rutas de gestión ni al panel", staffStatuses.every((s) => s === 403), staffStatuses.join(","));

r = await order("la-tienda-del-barrio", [{ productId: 2, quantity: 3 }], {});
const guestOrderId = r.data?.order?.id;
r = await fetch(`${API}/api/store/la-tienda-del-barrio/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${customerToken}` },
  body: JSON.stringify({ customerName: "Cliente Prueba", customerPhone: "+54 11 5555-7777", items: [{ productId: 1, quantity: 2 }] }),
}).then(async (res) => ({ status: res.status, data: await res.json() }));
const customerOrderId = r.data?.order?.id;
check("Pedido con sesión de cliente", r.status === 201, `status ${r.status}`);

r = await call("GET", "/api/store/la-tienda-del-barrio/customers/me/orders", { token: customerToken });
const myIds = (r.data?.orders || []).map((o) => o.id);
check("Mis pedidos: solo los del cliente", r.status === 200 && myIds.includes(customerOrderId) && !myIds.includes(guestOrderId) && myIds.length === 1,
  `status ${r.status}, pedidos ${myIds.join(",")}`);

r = await call("GET", "/api/store/comidas-don-jorge/customers/me/orders", { token: customerToken });
check("Mis pedidos: la sesión de una tienda no sirve en otra", r.status === 403, `status ${r.status}`);

r = await call("GET", "/api/store/comidas-don-jorge/customers/me/orders", { token: jorgeCustomerToken });
check("Mis pedidos: sin pedidos en la otra tienda", r.status === 200 && r.data.orders.length === 0, `status ${r.status}, ${r.data?.orders?.length}`);

r = await call("GET", "/api/customers", { token });
const listed = r.data?.customers?.find((c) => c.email === customerEmail);
check("La tienda ve a su cliente con su número de pedidos", r.status === 200 && listed && listed.order_count === 1, `status ${r.status}, pedidos ${listed?.order_count}`);

r = await call("GET", "/api/customers", { token: jorgeToken });
const jorgeList = r.data?.customers || [];
check("Otra tienda no ve los clientes ajenos", r.status === 200 && jorgeList.every((c) => c.id !== listed?.id), `${jorgeList.length} clientes`);

const staffOrder = (await call("GET", "/api/store/la-tienda-del-barrio/orders", { token })).data?.orders.find((o) => o.id === customerOrderId);
check("Pedidos del personal muestran el cliente registrado", staffOrder?.customer_email === customerEmail, `${staffOrder?.customer_email}`);

r = await call("PATCH", `/api/admin/businesses/${newBusinessId}/status`, { token: superToken, body: { isActive: false } });
r = await call("POST", `/api/store/${newSlug}/customers/register`, { body: { ...newCustomer, email: `z${stamp}@prueba.com` } });
await call("PATCH", `/api/admin/businesses/${newBusinessId}/status`, { token: superToken, body: { isActive: true } });
check("No hay registro de clientes en una tienda suspendida", r.status === 404, `status ${r.status}`);

// --- Estadísticas de la tienda
r = await call("GET", "/api/stats", { token });
const statsBefore = r.data;
check("Estadísticas: 30 días por defecto", r.status === 200 && statsBefore.days === 30 && statsBefore.daily.length === 30, `status ${r.status}, ${statsBefore?.daily?.length} días`);

r = await call("GET", "/api/stats?days=7", { token });
const r9 = await call("GET", "/api/stats?days=999", { token });
check("Estadísticas: períodos 7 días y valor no permitido -> 30", r.data?.daily?.length === 7 && r9.data?.days === 30, `${r.data?.daily?.length} / ${r9.data?.days}`);

const statsStatuses = [
  (await call("GET", "/api/stats")).status,
  (await call("GET", "/api/stats", { token: customerToken })).status,
  (await call("GET", "/api/stats", { token: superToken })).status,
];
check("Estadísticas: solo el personal de la tienda", statsStatuses.join(",") === "401,403,403", statsStatuses.join(","));

const priceOf = async (id) => Number((await call("GET", `/api/store/la-tienda-del-barrio`)).data.products.find((p) => p.id === id).price);
const p5 = await priceOf(5);
const o1 = (await order("la-tienda-del-barrio", [{ productId: 5, quantity: 2 }])).data.order.id;
const o2 = (await order("la-tienda-del-barrio", [{ productId: 5, quantity: 1 }])).data.order.id;
let statsAfter = (await call("GET", "/api/stats", { token })).data;
const expectedRevenue = Math.round((statsBefore.summary.revenue + p5 * 3) * 100) / 100;
check("Estadísticas: suman los pedidos nuevos", statsAfter.summary.orders === statsBefore.summary.orders + 2 && statsAfter.summary.revenue === expectedRevenue,
  `pedidos ${statsBefore.summary.orders}->${statsAfter.summary.orders}, ventas ${statsBefore.summary.revenue}->${statsAfter.summary.revenue} (esperado ${expectedRevenue})`);
check("Estadísticas: el último día incluye los pedidos de hoy", statsAfter.daily.at(-1).orders >= 2, `hoy: ${statsAfter.daily.at(-1).orders} pedidos`);
check("Estadísticas: productos más vendidos", statsAfter.topProducts.some((p) => p.name === "Queso Manchego"), statsAfter.topProducts.map((p) => p.name).join(", "));

await call("PUT", `/api/store/la-tienda-del-barrio/orders/${o2}/status`, { token, body: { status: "cancelled" } });
const cancelled = (await call("GET", "/api/stats", { token })).data;
check("Estadísticas: los pedidos cancelados no suman ventas", cancelled.summary.orders === statsAfter.summary.orders - 1 && cancelled.byStatus.cancelled === statsAfter.byStatus.cancelled + 1,
  `pedidos ${cancelled.summary.orders}, cancelados ${cancelled.byStatus.cancelled}`);

const jorgeStats = (await call("GET", "/api/stats", { token: jorgeToken })).data;
check("Estadísticas: cada tienda ve solo lo suyo", !jorgeStats.topProducts.some((p) => p.name === "Queso Manchego"), jorgeStats.topProducts.map((p) => p.name).join(", "));

// Zona horaria: con UTC+14 (Kiritimati) "hoy" es distinto que en UTC−10 (Honolulu) durante gran parte del día.
const mine = (await call("GET", "/api/businesses/mine", { token })).data.business;
const localToday = (tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const lastDays = [];
for (const tz of ["Pacific/Kiritimati", "Pacific/Honolulu"]) {
  await call("PUT", "/api/businesses/mine", { token, body: { ...settingsOf(mine), timezone: tz } });
  lastDays.push([(await call("GET", "/api/stats?days=7", { token })).data.daily.at(-1).day, localToday(tz)]);
}
r = await call("PUT", "/api/businesses/mine", { token, body: { ...settingsOf(mine), timezone: "Marte/Olympus" } });
await call("PUT", "/api/businesses/mine", { token, body: settingsOf(mine) });
check("Estadísticas: 'hoy' según la zona horaria de la tienda", lastDays.every(([api, expected]) => api === expected), JSON.stringify(lastDays));
check("Mi tienda: zona horaria no válida rechazada", r.status === 400, `status ${r.status}`);
void o1;

for (const t of results) console.log(`${t.ok ? "OK   " : "FALLA"} ${t.name}  (${t.detail})`);

const failed = results.filter((t) => !t.ok).length;
console.log(`\n${results.length - failed} correctas, ${failed} fallidas`);
process.exitCode = failed ? 1 : 0;
