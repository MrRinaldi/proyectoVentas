// Configuración de los tipos de tienda y de producto. Para adaptar la plataforma a un rubro nuevo,
// normalmente basta con añadir una entrada aquí (ver CLAUDE.md, "Tipos de tienda y producto").

// Tipos de tienda (businesses.type): nombre y cómo se muestran las categorías en la tienda.
// - "tabs": pestañas horizontales sobre los productos (rápido para menús de comida).
// - "sidebar": lista lateral (en el móvil, un botón abre la lista).
// Un tipo nuevo también debe añadirse al ENUM de businesses.type (init.sql + migración) y a
// STORE_TYPES en backend/src/utils/businessSettings.js.
export const STORE_TYPES = {
  grocery: { label: "Almacén", categoryLayout: "sidebar" },
  food: { label: "Comidas", categoryLayout: "tabs" },
  perfumery: { label: "Perfumería", categoryLayout: "sidebar" },
};

const DEFAULT_STORE_TYPE = { label: "Tienda", categoryLayout: "sidebar" };

export function getStoreType(type) {
  return STORE_TYPES[type] || DEFAULT_STORE_TYPE;
}

// Tipos de producto (products.product_type, texto libre): icono, nombre y opciones que el cliente
// elige al añadir el producto al carrito. Hoy la única opción con soporte en el carrito y en el
// backend es meatCount (cantidad de carnes); otra opción nueva necesita ese mismo soporte.
export const PRODUCT_TYPES = {
  burger: {
    icon: "🍔",
    label: "Hamburguesa",
    options: [{ key: "meatCount", label: "Cantidad de carnes", values: [1, 2, 3, 4] }],
  },
  drink: { icon: "🥤", label: "Bebida" },
  side: { icon: "🍟", label: "Acompañamiento" },
  dessert: { icon: "🍰", label: "Postre" },
};

const DEFAULT_PRODUCT_TYPE = { icon: "📦", label: null };

export function getProductType(type) {
  return { options: [], ...DEFAULT_PRODUCT_TYPE, ...PRODUCT_TYPES[type] };
}

// Texto de las opciones elegidas, p. ej. "2 carnes" (carrito, pedidos y "Mis pedidos").
export function describeOptions(options) {
  if (!options?.meatCount) return "";
  return `${options.meatCount} carne${options.meatCount > 1 ? "s" : ""}`;
}
