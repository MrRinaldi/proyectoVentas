import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { getImageUrl, showPlaceholderOnError } from "../utils/images";
import { formatPrice } from "../utils/money";
import { getProductType } from "../config/catalog";

// Valor inicial de cada opción del tipo de producto (el primero de la lista).
const defaultOptions = (options) =>
  Object.fromEntries(options.map((option) => [option.key, option.values[0]]));

// Tarjeta de producto para cualquier tipo de tienda. El icono, el nombre del tipo y las opciones
// (p. ej. cantidad de carnes) salen de PRODUCT_TYPES en config/catalog.js.
function ProductCard({ product, business }) {
  const { addToCart } = useContext(CartContext);
  const productType = getProductType(product.product_type);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState(() => defaultOptions(productType.options));

  const handleAddToCart = () => {
    addToCart({ ...product, ...selected }, quantity);
    setQuantity(1);
    setSelected(defaultOptions(productType.options));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(product.image_medium || product.image)}
          alt={product.name}
          onError={showPlaceholderOnError}
          className="w-full h-full object-cover"
        />
        {productType.label && (
          <span className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {productType.icon} {productType.label}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-gray-800">
          {!productType.label && <span className="mr-1">{productType.icon}</span>}
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-3 flex-1">{product.description}</p>

        <p className="text-2xl font-bold text-[var(--brand)] my-3">
          {formatPrice(product.price, business)}
        </p>

        {productType.options.map((option) => (
          <fieldset key={option.key} className="mb-3">
            <legend className="text-sm font-semibold text-gray-700 mb-1">{option.label}</legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer px-3 py-1 rounded-full border text-sm ${selected[option.key] === value
                    ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "border-gray-300 text-gray-700"}`}
                >
                  <input
                    type="radio"
                    name={`${option.key}-${product.id}`}
                    value={value}
                    checked={selected[option.key] === value}
                    onChange={() => setSelected((prev) => ({ ...prev, [option.key]: value }))}
                    className="sr-only"
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Quitar uno"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            >
              −
            </button>
            <span className="px-3 font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Añadir uno"
              className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-[var(--brand)] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
