import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import StoreSettingsForm from "../components/StoreSettingsForm";

const API = `${import.meta.env.VITE_API_URL}/api/businesses/mine`;

// "Mi tienda": el administrador de la tienda configura nombre, moneda, color, logo y WhatsApp.
function StoreSettings() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");

  const request = useCallback(async (options = {}) => {
    const response = await fetch(API, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    // Token caducado o inválido: al cerrar sesión, el efecto redirige al login.
    if (response.status === 401) {
      logout();
      return null;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error en la petición");
    return data;
  }, [logout]);

  const loadBusiness = useCallback(() => {
    return request()
      .then((data) => { if (data) setBusiness(data.business); })
      .catch((err) => setError(err.message));
  }, [request]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isOwner()) {
      navigate(`/${slug}`);
      return;
    }
    // Cada administrador solo configura su propia tienda.
    if (user.businessSlug !== slug) {
      navigate(`/${user.businessSlug}/settings`);
      return;
    }
    loadBusiness();
  }, [slug, user, isOwner, navigate, loadBusiness]);

  const saveSettings = async (values) => {
    const data = await request({ method: "PUT", body: JSON.stringify(values) });
    if (data) await loadBusiness();
  };

  if (error) return <p className="p-4 text-red-700">{error}</p>;
  if (!business) return <p className="p-4">Cargando...</p>;

  return (
    <StoreLayout business={business}>
      <StoreHeader business={business} />
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-1">Mi tienda</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Estos datos se aplican a toda tu tienda: catálogo, carrito, pedidos y mensajes.
        </p>
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <StoreSettingsForm business={business} onSave={saveSettings} />
        </section>
      </main>
    </StoreLayout>
  );
}

export default StoreSettings;
