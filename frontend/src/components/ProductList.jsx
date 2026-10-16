import ProductCard from "./ProductCard";

function ProductList({ products, business }) {
  if (!products || products.length === 0) {
    return <p className="text-gray-500 text-center py-12">No hay productos disponibles en esta categoría.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} business={business} />
      ))}
    </div>
  );
}

export default ProductList;
