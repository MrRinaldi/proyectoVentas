import BurgerProductCard from "./BurgerProductCard";

function BurgerProductList({ products, business }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🍔</div>
        <p className="text-gray-500 text-lg">
          No hay productos disponibles en esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <BurgerProductCard key={product.id} product={product} business={business} />
      ))}
    </div>
  );
}

export default BurgerProductList;
