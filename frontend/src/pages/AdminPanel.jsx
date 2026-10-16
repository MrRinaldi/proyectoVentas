import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api/admin`;

const STORE_TYPES = {
  grocery: "Almacén",
  food: "Comidas",
  perfumery: "Perfumería",
};

const emptyForm = {
  businessName: "",
  type: "grocery",
  ownerEmail: "",
  ownerPassword: "",
  whatsappNumber: "",
  phone: "",
};

// Panel del superadministrador: ver, crear y suspender las tiendas de la plataforma.
function AdminPanel() {
  const { user, isSuperadmin, logout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  // fetch con el token; si la sesión ya no es válida, cierra sesión (y el efecto lleva al login).
  const adminFetch = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (response.status === 401) {
      logout();
      return null;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error en la petición");
    return data;
  }, [logout]);

  const loadBusinesses = useCallback(async () => {
    try {
      const data = await adminFetch("/businesses");
      if (data) setBusinesses(data.businesses);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (!isSuperadmin()) {
      navigate("/login");
      return;
    }
    loadBusinesses();
  }, [user, isSuperadmin, navigate, loadBusinesses]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = await adminFetch("/businesses", { method: "POST", body: JSON.stringify(form) });
      if (!data) return;
      setForm(emptyForm);
      setMessage({ type: "ok", text: `Tienda "${data.business.name}" creada en /${data.business.slug}.` });
      loadBusinesses();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (business) => {
    const suspend = Boolean(business.is_active);
    if (suspend && !window.confirm(`¿Suspender "${business.name}"? Dejará de verse y de recibir pedidos.`)) {
      return;
    }
    setMessage(null);
    try {
      const data = await adminFetch(`/businesses/${business.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !suspend }),
      });
      if (!data) return;
      setMessage({ type: "ok", text: `${data.message}: ${business.name}.` });
      loadBusinesses();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const inputClass = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center px-4 sm:px-6 py-4 bg-white shadow-sm">
        <h1 className="text-lg sm:text-xl font-bold">Panel de la plataforma</h1>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-gray-600">{user?.email}</span>
          <button onClick={handleLogout} className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {message && (
          <div className={`px-4 py-3 rounded border ${message.type === "ok"
            ? "bg-green-50 border-green-300 text-green-800"
            : "bg-red-50 border-red-300 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Crear tienda</h2>
          <form onSubmit={createBusiness} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-gray-700">
              Nombre de la tienda
              <input name="businessName" value={form.businessName} onChange={handleChange} required className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Tipo
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                {Object.entries(STORE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Email del administrador de la tienda
              <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleChange} required className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Contraseña inicial (mínimo 8 caracteres)
              <input type="password" name="ownerPassword" value={form.ownerPassword} onChange={handleChange}
                required minLength={8} autoComplete="new-password" className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              WhatsApp (opcional)
              <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="+54 11 5555-1234" className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Teléfono (opcional)
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Creando..." : "Crear tienda"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Tiendas ({businesses.length})</h2>
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Tienda</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Administrador</th>
                    <th className="py-2 pr-4">Productos</th>
                    <th className="py-2 pr-4">Pedidos</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => (
                    <tr key={business.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{business.name}</div>
                        {business.is_active ? (
                          <Link to={`/${business.slug}`} className="text-blue-600 text-xs">/{business.slug}</Link>
                        ) : (
                          <span className="text-gray-400 text-xs">/{business.slug}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{STORE_TYPES[business.type] || business.type}</td>
                      <td className="py-2 pr-4">{business.owner_email || "—"}</td>
                      <td className="py-2 pr-4">{business.product_count}</td>
                      <td className="py-2 pr-4">{business.order_count}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${business.is_active
                          ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {business.is_active ? "Activa" : "Suspendida"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => toggleStatus(business)}
                          className={`text-xs px-3 py-1 rounded ${business.is_active
                            ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                          {business.is_active ? "Suspender" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
