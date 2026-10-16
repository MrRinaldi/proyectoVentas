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
check("Lista de tiendas", r.status === 200 && r.data.businesses?.length === 3, `status ${r.status}`);

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

for (const t of results) console.log(`${t.ok ? "OK   " : "FALLA"} ${t.name}  (${t.detail})`);

const failed = results.filter((t) => !t.ok).length;
console.log(`\n${results.length - failed} correctas, ${failed} fallidas`);
process.exitCode = failed ? 1 : 0;
