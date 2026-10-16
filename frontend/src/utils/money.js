// Formatea importes con la moneda y el idioma de cada tienda (businesses.currency y businesses.locale).
// Ejemplos: 2.5 con EUR/es-ES -> "2,50 €"; 1500 con ARS/es-AR -> "$ 1.500,00"; 95 con USD/en-US -> "$95.00".
// Usa Intl, que conoce todas las monedas ISO 4217: añadir una moneda no requiere cambiar este código.

const DEFAULT_CURRENCY = "ARS";
const DEFAULT_LOCALE = "es-AR";

const formatters = new Map();

function getFormatter(currency, locale) {
  const key = `${locale}|${currency}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat(locale, { style: "currency", currency }));
  }
  return formatters.get(key);
}

// amount: número o texto ("2.50", como lo devuelve MySQL).
// store: objeto con currency y locale (la tienda, o un pedido con su propia currency).
export function formatPrice(amount, store) {
  const currency = store?.currency || DEFAULT_CURRENCY;
  const locale = store?.locale || DEFAULT_LOCALE;
  try {
    return getFormatter(currency, locale).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}
