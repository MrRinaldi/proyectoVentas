import { useContext, useState, useRef, useEffect } from "react";
import { formatPrice } from "../utils/money";
import { CartContext } from "../context/CartContext";
import CheckoutModal from "./CheckoutModal";
import { describeOptions, getProductType } from "../config/catalog";

function MiniCart({ business }) {

  const {
    cart,
    total,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart
  } = useContext(CartContext);

  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cartRef = useRef();

  const totalItems = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  // cerrar si haces click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  return (

    <div ref={cartRef} className="relative">

      {/* BOTON CARRITO */}

      <button
        onClick={() => setOpen(!open)}
        className="relative bg-[var(--brand)] text-white px-4 py-2 rounded-lg hover:opacity-90"
      >
        🛒

        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
            {totalItems}
          </span>
        )}

      </button>


      {/* PANEL CARRITO */}

      {open && (

        <div className="absolute right-0 mt-3 w-80 bg-white border shadow-xl rounded-xl p-4 z-50">

          <h3 className="font-semibold mb-3">
            Carrito
          </h3>


          {cart.length === 0 && (
            <p className="text-gray-500 text-sm">
              Carrito vacío
            </p>
          )}


          {cart.map(item => (

            <div
              key={item.meatCount ? `${item.id}-meat${item.meatCount}` : item.id}
              className="flex justify-between items-center mb-3 pb-3 border-b last:border-0"
            >

              <div className="flex flex-col text-sm flex-1">

                <div className="flex items-center gap-1">
                  <span className="text-base">{getProductType(item.product_type).icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>

                {describeOptions(item) && (
                  <span className="text-gray-600 text-xs font-semibold ml-5">
                    {describeOptions(item)}
                  </span>
                )}

                <span className="text-gray-500">
                  {formatPrice(item.price, business)}
                </span>

              </div>


              <div className="flex items-center gap-1 ml-2">

                <button
                  onClick={() => decreaseQuantity(item.id, item.meatCount || null)}
                  className="px-2 py-1 border rounded hover:bg-gray-100"
                >
                  −
                </button>

                <span className="w-6 text-center font-semibold">{item.quantity}</span>

                <button
                  onClick={() => increaseQuantity(item.id, item.meatCount || null)}
                  className="px-2 py-1 border rounded hover:bg-gray-100"
                >
                  +
                </button>

                <button
                  onClick={() => removeFromCart(item.id, item.meatCount || null)}
                  className="text-red-500 ml-1 hover:text-red-700 px-2"
                >
                  🗑
                </button>

              </div>

            </div>

          ))}


          <div className="border-t pt-3 mt-3 font-semibold">
            Total: {formatPrice(total, business)}
          </div>


          <button
            onClick={() => {
              setOpen(false);
              setCheckoutOpen(true);
            }}
            className="w-full mt-3 bg-[var(--brand)] text-white py-2 rounded-lg hover:opacity-90"
          >
            Finalizar compra
          </button>

        </div>

      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        business={business}
      />

    </div>

  );
}

export default MiniCart;