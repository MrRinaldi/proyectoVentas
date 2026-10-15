import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import ProductList from "../components/ProductList";
import SidebarCategories from "../components/SidebarCategories";

function Store() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();

  const [store, setStore] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`)
      .then(res => res.json())
      .then(data => setStore(data));
  }, [slug]);

  if (!store) return <p className="p-4">Cargando...</p>;

  const filteredProducts = selectedCategory
    ? store.products.filter(
        product => product.category_id === selectedCategory
      )
    : store.products;

  return (
    <StoreLayout>

      <StoreHeader business={store.business} />

      {/* BOTON CATEGORIAS MOBILE */}
{!sidebarOpen && (
 <div className="md:hidden p-3">
  <button
    onClick={() => setSidebarOpen(true)}
    className="w-full bg-black text-white py-3 rounded-lg shadow"
  >
    ☰ Categorías
  </button>
</div>
)}

      <div className="flex flex-col md:flex-row">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden md:block w-64 border-r p-4">
          <SidebarCategories
            categories={store.categories}
            setSelectedCategory={setSelectedCategory}
          />
        </aside>

        {/* PRODUCTOS */}
        <main className="flex-1 p-3 md:p-6">
          <ProductList products={filteredProducts} />
        </main>

      </div>

      {/* SIDEBAR MOBILE (DRAWER) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-50">

          <div className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-xl">

            <button
              onClick={() => setSidebarOpen(false)}
              className="mb-4 text-gray-600"
            >
              ✕ Cerrar
            </button>

            <SidebarCategories
              categories={store.categories}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                setSidebarOpen(false);
              }}
            />

          </div>

        </div>
      )}

    </StoreLayout>
  );
}

export default Store;