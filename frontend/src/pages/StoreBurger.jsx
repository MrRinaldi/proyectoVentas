import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";
import BurgerCategoryTabs from "../components/BurgerCategoryTabs";
import BurgerProductList from "../components/BurgerProductList";

function StoreBurger() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();

  const [store, setStore] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`)
      .then(res => res.json())
      .then(data => setStore(data));
  }, [slug]);

  if (!store) return <p className="p-4 text-center text-lg">Cargando...</p>;

  const filteredProducts = selectedCategory
    ? store.products.filter(
        product => product.category_id === selectedCategory
      )
    : store.products;

  return (
    <StoreLayout>
      
      {/* Header */}
      <StoreHeader business={store.business} />

      {/* Categorías en pestañas */}
      <BurgerCategoryTabs
        categories={store.categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Productos */}
      <main className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <BurgerProductList products={filteredProducts} />
      </main>

    </StoreLayout>
  );
}

export default StoreBurger;
