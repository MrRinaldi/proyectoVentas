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

function BurgerProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [meatCount, setMeatCount] = useState(1);

  const imageUrl = product.image_medium
    ? `${import.meta.env.VITE_API_URL}${product.image_medium}`
    : product.image
      ? `${import.meta.env.VITE_API_URL}${product.image}`
      : `${import.meta.env.VITE_API_URL}/images/burger.jpg`;

  const handleAddToCart = () => {
    const itemWithOptions = {
      ...product,
      ...(product.product_type === 'burger' && { meatCount })
    };
    addToCart(itemWithOptions, quantity);
    setQuantity(1);
    setMeatCount(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      
      {/* Imagen con overlay */}
      <div className="relative overflow-hidden h-56">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Etiqueta de tipo de producto */}
        <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <span>{getProductIcon(product.product_type)}</span>
          <span className="capitalize text-xs">{product.product_type}</span>
        </div>
        
        {/* Etiqueta de disponibilidad */}
        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          Disponible
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col">
        
        {/* Nombre y descripción */}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {product.description}
          </p>
        </div>

        {/* Precio */}
        <div className="my-3 border-t pt-3">
          <span className="text-3xl font-bold text-orange-600">
            ${product.price}
          </span>
        </div>

        {/* Selector de carnes — solo para hamburguesas */}
        {product.product_type === 'burger' && (
          <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">🍖 Cantidad de Carnes:</p>
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3, 4].map((count) => (
                <label key={count} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`meat-${product.id}`}
                    value={count}
                    checked={meatCount === count}
                    onChange={() => setMeatCount(count)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">{count}x</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Controles de cantidad y agregar */}
        <div className="flex items-center gap-3">
          
          {/* Selector de cantidad */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
            >
              −
            </button>
            <span className="px-4 font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
            >
              +
            </button>
          </div>

          {/* Botón agregar */}
          <button
            onClick={handleAddToCart}
            className={`flex-1 bg-gradient-to-r ${getProductColor(product.product_type)} text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all`}
          >
            🛒 Agregar
          </button>
        </div>

      </div>

    </div>
  );
}

export default BurgerProductCard;
