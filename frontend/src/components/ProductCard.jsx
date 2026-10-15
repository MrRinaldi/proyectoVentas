import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";

// Función para obtener ícono según tipo de producto
function getProductIcon(productType) {
  const icons = {
    burger: '🍔',
    drink: '🥤',
    side: '🍟',
    dessert: '🍰',
    other: '📦'
  };
  return icons[productType] || icons.other;
}

// Función para obtener color según tipo de producto
function getProductColor(productType) {
  const colors = {
    burger: 'from-orange-500 to-red-600',
    drink: 'from-blue-500 to-cyan-600',
    side: 'from-yellow-500 to-orange-600',
    dessert: 'from-pink-500 to-purple-600',
    other: 'from-gray-500 to-gray-700'
  };
  return colors[productType] || colors.other;
}

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [showOptions, setShowOptions] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [meatCount, setMeatCount] = useState(1);

  // Construir la URL completa de la imagen desde el backend
  const imageUrl = product.image_medium ? `${import.meta.env.VITE_API_URL}${product.image_medium}` : '/placeholder-image.jpg';

  const handleAddToCart = () => {
    const itemWithOptions = {
      ...product,
      meatCount: meatCount
    };
    addToCart(itemWithOptions, quantity);
    setQuantity(1);
    setMeatCount(1);
    setShowOptions(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
      
      <img src={imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-t-xl mb-4" />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{getProductIcon(product.product_type)}</span>
          <h3 className="font-semibold text-lg">{product.name}</h3>
        </div>

        <p className="text-gray-500 text-sm mt-1">
          {product.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-bold text-green-600">
          ${product.price}
        </span>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`bg-gradient-to-r ${getProductColor(product.product_type)} text-white px-3 py-2 rounded-lg hover:shadow-lg transition`}
        >
          Agregar
        </button>
      </div>

      {/* Panel de opciones */}
      {showOptions && (
        <div className="mt-4 p-3 border-t border-gray-200 bg-gray-50 rounded-lg">
          
          {/* Selector de carnes */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">Cantidad de Carnes:</p>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4].map((count) => (
                <label key={count} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`meat-${product.id}`}
                    value={count}
                    checked={meatCount === count}
                    onChange={() => setMeatCount(count)}
                    className="w-3 h-3 cursor-pointer"
                  />
                  <span className="text-xs font-medium">{count}x</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selector de cantidad */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold">Cantidad:</span>
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                −
              </button>
              <span className="px-3 text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm font-semibold"
            >
              Confirmar
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400 transition text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default ProductCard;