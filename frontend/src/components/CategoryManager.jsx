import { useState } from "react";

const API = `${import.meta.env.VITE_API_URL}/api/categories`;

// Crear, renombrar y eliminar las categorías de la tienda.
// onChange(categorías) se llama tras cada cambio con la lista actualizada.
function CategoryManager({ categories, onChange }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error en la petición");
    return data;
  };

  // Ejecuta un cambio y recarga la lista; muestra el error si falla.
  const run = async (change) => {
    setError("");
    try {
      await change();
      onChange(await request(""));
    } catch (err) {
      setError(err.message);
    }
  };

  const create = (e) => {
    e.preventDefault();
    run(async () => {
      await request("", { method: "POST", body: JSON.stringify({ name: newName }) });
      setNewName("");
    });
  };

  const rename = (id) => run(async () => {
    await request(`/${id}`, { method: "PUT", body: JSON.stringify({ name: editingName }) });
    setEditingId(null);
  });

  const remove = (category) => {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"? Sus productos quedarán sin categoría.`)) return;
    run(() => request(`/${category.id}`, { method: "DELETE" }));
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-3">Categorías</h2>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <ul className="divide-y mb-4">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 py-2">
            {editingId === category.id ? (
              <>
                <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
                <button onClick={() => rename(category.id)} className="text-sm text-blue-700">Guardar</button>
                <button onClick={() => setEditingId(null)} className="text-sm text-gray-600">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{category.name}</span>
                <button onClick={() => { setEditingId(category.id); setEditingName(category.name); }}
                  className="text-sm text-blue-700">Renombrar</button>
                <button onClick={() => remove(category)} className="text-sm text-red-700">Eliminar</button>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && <li className="py-2 text-sm text-gray-500">Todavía no hay categorías.</li>}
      </ul>

      <form onSubmit={create} className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva categoría"
          required maxLength={100} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          Añadir
        </button>
      </form>
    </section>
  );
}

export default CategoryManager;
