import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import SalesChart from "../components/SalesChart";
import { formatPrice } from "../utils/money";
import { getStatusColor, getStatusText } from "../utils/orderStatus";

const PERIODS = [7, 30, 90];

// Variación respecto al período anterior: "+12 %", "−5 %" o null si no hay con qué comparar.
function change(current, previous) {
  if (!previous) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent)} %`;
}

function StatTile({ label, value, detail }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
    </div>
  );
}

// Panel de estadísticas de la tienda para su personal.
function StoreStats() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const [days, setDays] = useState(30);
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState(null);
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
    if (user.businessSlug !== slug) {
      navigate(`/${user.businessSlug}/estadisticas`);
      return;
    }

    const api = import.meta.env.VITE_API_URL;
    Promise.all([
      fetch(`${api}/api/store/${slug}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`${api}/api/stats?days=${days}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
    ])
      .then(async ([storeData, statsRes]) => {
        // Token caducado o inválido: al cerrar sesión, este efecto redirige al login.
        if (statsRes.status === 401) {
          logout();
          return;
        }
        if (!storeData || !statsRes.ok) throw new Error("No se pudieron cargar las estadísticas");
        setStore(storeData);
        setStats(await statsRes.json());
      })
      .catch((err) => setError(err.message));
  }, [slug, days, user, isOwner, logout, navigate]);

  if (error) return <p className="p-4 text-red-700">{error}</p>;
  if (!store || !stats) return <p className="p-4">Cargando...</p>;

  const money = { currency: stats.currency, locale: stats.locale };
  const { summary, previous, customers } = stats;
  const revenueChange = change(summary.revenue, previous.revenue);
  const ordersChange = change(summary.orders, previous.orders);
  const statusTotal = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
  const topMax = Math.max(...stats.topProducts.map((p) => p.revenue), 0);

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Estadísticas</h2>
            <p className="text-sm text-gray-500">Pedidos no cancelados, en {stats.currency}. Días según la zona horaria de la tienda.</p>
          </div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden" role="group" aria-label="Período">
            {PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => setDays(period)}
                className={`px-4 py-2 text-sm ${days === period ? "bg-[var(--brand)] text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
              >
                {period} días
              </button>
            ))}
          </div>
        </div>

        {summary.otherCurrencyOrders > 0 && (
          <p className="text-sm bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-2">
            ⚠️ {summary.otherCurrencyOrders} pedido(s) del período se hicieron en otra moneda y no se suman aquí.
          </p>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Ventas"
            value={formatPrice(summary.revenue, money)}
            detail={revenueChange ? `${revenueChange} vs. ${days} días anteriores` : "Sin datos del período anterior"}
          />
          <StatTile
            label="Pedidos"
            value={summary.orders}
            detail={ordersChange ? `${ordersChange} vs. ${days} días anteriores` : "Sin datos del período anterior"}
          />
          <StatTile label="Ticket medio" value={formatPrice(summary.averageTicket, money)} detail="Ventas ÷ pedidos" />
          <Link to={`/${slug}/orders`} className="block hover:opacity-90">
            <StatTile label="Pendientes de atender" value={summary.pendingNow} detail="Ahora mismo · ver pedidos →" />
          </Link>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="font-semibold mb-6">Ventas por día</h3>
          <SalesChart daily={stats.daily} money={money} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h3 className="font-semibold mb-4">Productos más vendidos</h3>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Sin ventas en este período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-2">Producto</th>
                    <th className="py-2 pr-2 text-right">Unidades</th>
                    <th className="py-2 text-right">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product) => (
                    <tr key={product.name} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <div>{product.name}</div>
                        <div className="h-1.5 mt-1 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${(product.revenue / topMax) * 100}%`, backgroundColor: "var(--chart-series-1)" }}
                          />
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right">{product.quantity}</td>
                      <td className="py-2 text-right whitespace-nowrap">{formatPrice(product.revenue, money)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Pedidos por estado</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </span>
                    <span className="text-gray-700">
                      {count}
                      <span className="text-gray-500"> {statusTotal ? `(${Math.round((count / statusTotal) * 100)} %)` : ""}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Clientes</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-gray-500">Nuevos en el período</dt><dd className="text-xl font-bold">{customers.newInPeriod}</dd></div>
                <div><dt className="text-gray-500">Registrados en total</dt><dd className="text-xl font-bold">{customers.total}</dd></div>
                <div><dt className="text-gray-500">Recurrentes (2+ pedidos)</dt><dd className="text-xl font-bold">{customers.returning}</dd></div>
                <div>
                  <dt className="text-gray-500">Pedidos con cuenta</dt>
                  <dd className="text-xl font-bold">
                    {summary.orders ? `${Math.round((summary.registeredOrders / summary.orders) * 100)} %` : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </main>
    </StoreLayout>
  );
}

export default StoreStats;
