import { useState } from "react";
import { formatPrice } from "../utils/money";
import { getImageUrl } from "../utils/images";
import { STORE_TYPES } from "../config/catalog";

// Todas las monedas ISO 4217 que conoce el navegador, con su nombre en español.
const currencyNames = new Intl.DisplayNames(["es"], { type: "currency" });
const CURRENCIES = Intl.supportedValuesOf("currency")
  .map((code) => ({ code, name: currencyNames.of(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"));

// Formatos de número más habituales. El backend acepta cualquier código válido.
const LOCALES = {
  "es-AR": "Español (Argentina)",
  "es-CL": "Español (Chile)",
  "es-CO": "Español (Colombia)",
  "es-ES": "Español (España)",
  "es-MX": "Español (México)",
  "es-PE": "Español (Perú)",
  "es-UY": "Español (Uruguay)",
  "en-US": "Inglés (Estados Unidos)",
  "pt-BR": "Portugués (Brasil)",
};


// Formulario de configuración de una tienda. Lo usan "Mi tienda" y el panel del superadmin
// (con showType, porque solo el superadmin cambia el tipo de tienda).
// onSave recibe los valores y devuelve una promesa; si falla, se muestra el error.
function StoreSettingsForm({ business, showType = false, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: business.name || "",
    type: business.type || "grocery",
    logo: business.logo || "",
    primaryColor: business.primary_color || "#2563eb",
    whatsappNumber: business.whatsapp_number || "",
    phone: business.phone || "",
    currency: business.currency || "ARS",
    locale: business.locale || "es-AR",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave(form);
      setMessage({ type: "ok", text: "Configuración guardada." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";
  const locales = LOCALES[form.locale] ? LOCALES : { ...LOCALES, [form.locale]: form.locale };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {message && (
        <div className={`sm:col-span-2 px-4 py-3 rounded border text-sm ${message.type === "ok"
          ? "bg-green-50 border-green-300 text-green-800" : "bg-red-50 border-red-300 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <label className="text-sm font-medium text-gray-700">
        Nombre de la tienda
        <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
      </label>

      {showType && (
        <label className="text-sm font-medium text-gray-700">
          Tipo de tienda
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {Object.entries(STORE_TYPES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="text-sm font-medium text-gray-700">
        Moneda
        <select name="currency" value={form.currency} onChange={handleChange} className={inputClass}>
          {CURRENCIES.map(({ code, name }) => (
            <option key={code} value={code}>{code} — {name}</option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-gray-700">
        Formato de números y fechas
        <select name="locale" value={form.locale} onChange={handleChange} className={inputClass}>
          {Object.entries(locales).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2 text-sm text-gray-600">
        Así se verán los precios: <strong>{formatPrice(1234.5, form)}</strong>
      </div>

      <label className="text-sm font-medium text-gray-700">
        Color de la marca
        <div className="mt-1 flex items-center gap-2">
          <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange}
            className="h-10 w-14 border border-gray-300 rounded" />
          <span className="text-gray-500 text-xs">{form.primaryColor}</span>
        </div>
      </label>

      <label className="text-sm font-medium text-gray-700">
        Logo (URL https://... o ruta /api/images/...)
        <div className="mt-1 flex items-center gap-2">
          <input name="logo" value={form.logo} onChange={handleChange} placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          {form.logo && (
            <img src={getImageUrl(form.logo)} alt="" className="w-10 h-10 rounded-full object-cover border"
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              onLoad={(e) => { e.currentTarget.style.visibility = "visible"; }} />
          )}
        </div>
      </label>

      <label className="text-sm font-medium text-gray-700">
        WhatsApp que recibe los pedidos
        <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange}
          placeholder="+54 11 5555-1234" className={inputClass} />
      </label>

      <label className="text-sm font-medium text-gray-700">
        Teléfono
        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
      </label>

      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300">
            Cerrar
          </button>
        )}
      </div>
    </form>
  );
}

export default StoreSettingsForm;
