import { createContext, useCallback, useEffect, useState } from "react";

export const CartContext = createContext();

// Cada tienda tiene su propio carrito, guardado en el navegador para que no se pierda al recargar.
const cartStorageKey = (slug) => `cart:${slug}`;

function readStoredCart(slug) {
  try {
    const items = JSON.parse(localStorage.getItem(cartStorageKey(slug)) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [storeSlug, setStoreSlug] = useState(null);
  const [cart, setCart] = useState([]);

  // Lo llama StoreHeader al entrar en una tienda: carga el carrito de esa tienda.
  const selectStore = useCallback((slug) => {
    setStoreSlug(slug);
    setCart(readStoredCart(slug));
  }, []);

  useEffect(() => {
    if (!storeSlug) return;
    try {
      localStorage.setItem(cartStorageKey(storeSlug), JSON.stringify(cart));
    } catch {
      // Sin almacenamiento disponible (modo privado): el carrito sigue funcionando en memoria.
    }
  }, [storeSlug, cart]);

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(item => 
      product.meatCount 
        ? item.id === product.id && item.meatCount === product.meatCount
        : item.id === product.id && !item.meatCount
    );

    if (existing) {
      setCart(cart.map(item =>
        (product.meatCount 
          ? item.id === product.id && item.meatCount === product.meatCount
          : item.id === product.id && !item.meatCount)
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: quantity }]);
    }
  };

  const removeFromCart = (id, meatCount = null) => {
    setCart(cart.filter(item => {
      if (meatCount !== null) {
        return !(item.id === id && item.meatCount === meatCount);
      }
      return item.id !== id;
    }));
  };

  const total = cart.reduce((acc, item) =>
    acc + item.price * item.quantity, 0
  );

  const increaseQuantity = (id, meatCount = null) => {
    setCart(cart.map(item =>
      meatCount !== null
        ? item.id === id && item.meatCount === meatCount
          ? { ...item, quantity: item.quantity + 1 }
          : item
        : item.id === id && !item.meatCount
          ? { ...item, quantity: item.quantity + 1 }
          : item
    ));
  };

  const decreaseQuantity = (id, meatCount = null) => {
    setCart(cart
      .map(item =>
        meatCount !== null
          ? item.id === id && item.meatCount === meatCount
            ? { ...item, quantity: item.quantity - 1 }
            : item
          : item.id === id && !item.meatCount
            ? { ...item, quantity: item.quantity - 1 }
            : item
      )
      .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = async (slug, customerName, customerPhone) => {
    try {
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        meatCount: item.meatCount || null
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          items
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error creando el pedido');
      }

      // Limpiar el carrito después de un pedido exitoso
      clearCart();

      return { success: true, order: data.order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <CartContext.Provider value={{
  cart,
  selectStore,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  checkout,
  total
}}>
      {children}
    </CartContext.Provider>
  );
}