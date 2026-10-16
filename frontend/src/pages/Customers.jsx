import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";

// Clientes registrados en la tienda, para su personal.
function Customers() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const [store, setStore] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isOwner()) {
      navigate(`/${slug}`);
      return;
    }
    // Cada tienda solo ve sus propios clientes.
    if (user.businessSlug !== slug) {
      navigate(`/${user.businessSlug}/clientes`);
      return;
    }

    const api = import.meta.env.VITE_API_URL;
    Promise.all([
      fetch(`${api}/api/store/${slug}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`${api}/api/customers`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
    ])
      .then(async ([storeData, customersRes]) => {
        // Token caducado o inválido: al cerrar sesión, este efecto redirige al login.
        if (customersRes.status === 401) {
          logout();
          return;
        }
        if (!storeData || !customersRes.ok) throw new Error("No se pudieron cargar los clientes");
        setStore(storeData);
        setCustomers((await customersRes.json()).customers);
      })
      .catch((err) => setError(err.message));
  }, [slug, user, isOwner, logout, navigate]);

  if (error) return <p className="p-4 text-red-700">{error}</p>;
  if (!store || !customers) return <p className="p-4">Cargando...</p>;

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString(store.business.locale) : "—");

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-1">Clientes</h2>
        <p className="text-gray-600 text-sm mb-6">
          Clientes que crearon una cuenta en tu tienda. Las compras sin cuenta aparecen solo en Pedidos.
        </p>

        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {customers.length === 0 ? (
            <p className="text-gray-500 text-sm">Todavía no hay clientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4">Pedidos</th>
                    <th className="py-2 pr-4">Último pedido</th>
                    <th className="py-2">Cliente desde</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{customer.name}</td>
                      <td className="py-2 pr-4">{customer.email}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{customer.phone}</td>
                      <td className="py-2 pr-4">{customer.order_count}</td>
                      <td className="py-2 pr-4">{formatDate(customer.last_order_at)}</td>
                      <td className="py-2">{formatDate(customer.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </StoreLayout>
  );
}

export default Customers;
