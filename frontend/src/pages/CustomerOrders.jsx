import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import { formatPrice } from "../utils/money";
import { getStatusColor, getStatusText } from "../utils/orderStatus";

// "Mis pedidos": los pedidos que el cliente hizo con su cuenta en esta tienda.
function CustomerOrders() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getSession, clearSession } = useCustomer();
  // El efecto depende del token (texto), no del objeto de sesión, que se crea de nuevo en cada render.
  const token = getSession(slug)?.token;
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate(`/${slug}/cuenta`);
      return;
    }
    const api = import.meta.env.VITE_API_URL;
    Promise.all([
      fetch(`${api}/api/store/${slug}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`${api}/api/store/${slug}/customers/me/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([storeData, ordersRes]) => {
        // Sesión caducada o de otra tienda: se cierra y se vuelve a pedir que entre.
        if (ordersRes.status === 401 || ordersRes.status === 403) {
          clearSession(slug);
          return;
        }
        if (!storeData || !ordersRes.ok) throw new Error("No se pudieron cargar tus pedidos");
        setStore(storeData);
        setOrders((await ordersRes.json()).orders);
      })
      .catch((err) => setError(err.message));
  }, [slug, token, navigate, clearSession]);

  if (error) return <p className="p-4 text-red-700">{error}</p>;
  if (!store || !orders) return <p className="p-4">Cargando...</p>;

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6">Mis pedidos</h2>

        {orders.length === 0 ? (
          <p className="text-gray-500">Todavía no hiciste pedidos con tu cuenta en esta tienda.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              // Cada pedido en su moneda, con el formato de la tienda.
              const money = { currency: order.currency, locale: store.business.locale };
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold">Pedido #{order.id}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString(store.business.locale)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <ul className="text-sm divide-y">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between py-1">
                        <span>
                          {item.product_name} x{item.quantity}
                          {item.options?.meatCount && ` · ${item.options.meatCount} carne${item.options.meatCount > 1 ? "s" : ""}`}
                        </span>
                        <span>{formatPrice(item.price * item.quantity, money)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-right font-bold mt-3">Total: {formatPrice(order.total, money)}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </StoreLayout>
  );
}

export default CustomerOrders;
