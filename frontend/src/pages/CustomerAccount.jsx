import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";

const emptyForm = { name: "", email: "", phone: "", password: "" };

// Entrar o crear una cuenta de cliente en esta tienda.
function CustomerAccount() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { saveSession } = useCustomer();
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? setStore(data) : setNotFound(true)));
  }, [slug]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}/customers/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo completar");
      saveSession(slug, data);
      navigate(`/${slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (notFound) return <p className="p-4">Tienda no encontrada.</p>;
  if (!store) return <p className="p-4">Cargando...</p>;

  const inputClass = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
  const tabClass = (active) => `flex-1 py-2 text-sm font-medium border-b-2 ${active
    ? "border-[var(--brand)] text-gray-900" : "border-transparent text-gray-500"}`;

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />
      <main className="max-w-md mx-auto p-4 sm:p-6">
        <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex mb-6">
            <button className={tabClass(mode === "login")} onClick={() => { setMode("login"); setError(""); }}>
              Entrar
            </button>
            <button className={tabClass(mode === "register")} onClick={() => { setMode("register"); setError(""); }}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded text-sm">{error}</div>}

            {mode === "register" && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                  <input name="name" value={form.name} onChange={handleChange} required autoComplete="name" className={inputClass} />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} required autoComplete="tel"
                    placeholder="+54 11 5555-1234" className={inputClass} />
                </label>
              </>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña{mode === "register" && " (mínimo 8 caracteres)"}
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "register" ? "new-password" : "current-password"} className={inputClass} />
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--brand)] text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? "Un momento..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-500 text-center">
            Tu cuenta es solo para {store.business.name}. ¿Administras esta tienda?{" "}
            <Link to="/login" className="underline">Acceso de administradores</Link>
          </p>
        </section>
      </main>
    </StoreLayout>
  );
}

export default CustomerAccount;
