import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import ProductList from "../components/ProductList";
import SidebarCategories from "../components/SidebarCategories";
import CategoryTabs from "../components/CategoryTabs";
import { getStoreType } from "../config/catalog";

// Página pública de una tienda. Cómo se muestran las categorías depende del tipo de tienda
// (STORE_TYPES en config/catalog.js): pestañas o lista lateral.
function Store() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? setStore(data) : setNotFound(true)));
  }, [slug]);

  if (notFound) {
    return <p className="p-8 text-center text-gray-600">Esta tienda no existe o no está disponible.</p>;
  }
  if (!store) return <p className="p-4">Cargando...</p>;

  const { categoryLayout } = getStoreType(store.business.type);
  const filteredProducts = selectedCategory
    ? store.products.filter((product) => product.category_id === selectedCategory)
    : store.products;

  const products = <ProductList products={filteredProducts} business={store.business} />;

  return (
    <StoreLayout business={store.business}>
      <StoreHeader business={store.business} />

      {categoryLayout === "tabs" ? (
        <>
          <CategoryTabs
            categories={store.categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          <main className="p-4 md:p-8">{products}</main>
        </>
      ) : (
        <>
          {/* Móvil: botón que abre la lista de categorías */}
          <div className="md:hidden p-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full bg-[var(--brand)] text-white py-3 rounded-lg shadow"
            >
              ☰ Categorías
            </button>
          </div>

          <div className="flex flex-col md:flex-row">
            <aside className="hidden md:block w-64 border-r p-4">
              <SidebarCategories
                categories={store.categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </aside>
            <main className="flex-1 p-3 md:p-6">{products}</main>
          </div>

          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSidebarOpen(false)}>
              <div className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSidebarOpen(false)} className="mb-4 text-gray-600">
                  ✕ Cerrar
                </button>
                <SidebarCategories
                  categories={store.categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(category) => {
                    setSelectedCategory(category);
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </StoreLayout>
  );
}

export default Store;
