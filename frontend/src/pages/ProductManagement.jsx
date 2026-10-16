import { useState, useEffect } from "react";
import { formatPrice } from "../utils/money";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import CategoryManager from "../components/CategoryManager";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image: "",
  product_type: "",
  is_active: true,
};

function ProductManagement() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isOwner()) {
      navigate(`/${slug}`);
      return;
    }

    const loadData = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // Token caducado o inválido: al cerrar sesión, este efecto redirige al login.
        if (productsRes.status === 401) {
          logout();
          return;
        }

        if (!storeRes.ok) {
          throw new Error("No se pudo cargar la tienda");
        }

        const storeData = await storeRes.json();
        const productsData = await productsRes.json();

        setStore(storeData);
        setCategories(storeData.categories || []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error(error);
        setMessage(error.message || "Error cargando productos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, user, isOwner, logout, navigate, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMessage("");
  };

  const refreshProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error refrescando productos:", error);
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category_id: form.category_id || null,
        image: form.image.trim() || null,
        product_type: form.product_type || null,
        is_active: form.is_active,
      };

      if (!payload.name || !payload.price) {
        setMessage("El nombre y el precio son obligatorios.");
        return;
      }

      const url = editingId
        ? `${import.meta.env.VITE_API_URL}/api/products/${editingId}`
        : `${import.meta.env.VITE_API_URL}/api/products`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error guardando producto");
      }

      // resetForm() borra el mensaje, así que va antes de mostrar el de éxito.
      resetForm();
      setMessage(editingId ? "Producto actualizado." : "Producto creado.");
      refreshProducts();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error guardando producto.");
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category_id: product.category_id || "",
      image: product.image || "",
      product_type: product.product_type || "",
      is_active: Boolean(product.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error eliminando producto");
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      setMessage("Producto eliminado.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Error eliminando producto.");
    }
  };

  if (!store || loading) {
    return <p className="p-4">Cargando...</p>;
  }

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />

      <div className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Gestión de artículos</h2>
            <p className="text-gray-600 mt-1">Administra productos de la tienda y actualiza inventario.</p>
          </div>
          <button
            onClick={() => navigate(`/${slug}/orders`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ver órdenes
          </button>
        </div>

        <div className="mb-8">
          <CategoryManager
            categories={categories}
            onChange={(updated) => {
              setCategories(updated);
              refreshProducts(); // los productos muestran el nombre de su categoría
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {editingId ? "Editar artículo" : "Crear nuevo artículo"}
          </h3>

          {message && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm text-white bg-black/80">
              {message}
            </div>
          )}

          <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Precio</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de producto</label>
              <input
                name="product_type"
                value={form.product_type}
                onChange={handleChange}
                placeholder="ej: burger, bebida, postre"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">URL de imagen</label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Artículo activo
              </label>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar artículo" : "Crear artículo"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Activo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.category_name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.product_type || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPrice(product.price, store.business)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                    <button
                      onClick={() => editProduct(product)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    No hay artículos creados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StoreLayout>
  );
}

export default ProductManagement;
