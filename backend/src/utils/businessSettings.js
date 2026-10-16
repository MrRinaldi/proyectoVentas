// Validación de la configuración de una tienda. La usan "Mi tienda" (administrador de la tienda)
// y el panel del superadministrador, para que las reglas sean las mismas en los dos sitios.

const STORE_TYPES = ["food", "grocery", "perfumery"];
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{5,18}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
// Ruta servida por el backend (/api/images/...) o URL externa.
const LOGO_PATTERN = /^(https?:\/\/|\/api\/images\/)\S+$/;
// Todas las monedas ISO 4217 que conoce Node: una moneda nueva no requiere cambiar código.
const SUPPORTED_CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

function canonicalLocale(locale) {
  try {
    return Intl.getCanonicalLocales(locale)[0] || null;
  } catch {
    return null;
  }
}

// Zona horaria IANA válida (p. ej. "America/Argentina/Buenos_Aires").
function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Texto opcional: "" o ausente -> null.
const optionalText = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

// Devuelve { error } si algo no es válido, o { settings } con los campos ya normalizados.
// allowType: solo el superadministrador puede cambiar el tipo de tienda.
function parseBusinessSettings(body, { allowType = false } = {}) {
  const { name, logo, primaryColor, whatsappNumber, phone, currency, locale, timezone, type } = body || {};

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 150) {
    return { error: "El nombre de la tienda debe tener entre 2 y 150 caracteres" };
  }

  const settings = {
    name: name.trim(),
    logo: optionalText(logo),
    primary_color: optionalText(primaryColor),
    whatsapp_number: optionalText(whatsappNumber),
    phone: optionalText(phone),
    currency: typeof currency === "string" ? currency.trim().toUpperCase() : "",
    locale: typeof locale === "string" ? canonicalLocale(locale.trim()) : null,
    timezone: typeof timezone === "string" ? timezone.trim() : "",
  };

  if (settings.logo && (settings.logo.length > 255 || !LOGO_PATTERN.test(settings.logo))) {
    return { error: "El logo debe ser una URL (https://...) o una ruta /api/images/..." };
  }
  if (settings.primary_color && !COLOR_PATTERN.test(settings.primary_color)) {
    return { error: "El color debe tener el formato #RRGGBB" };
  }
  for (const value of [settings.whatsapp_number, settings.phone]) {
    if (value && !PHONE_PATTERN.test(value)) {
      return { error: "Teléfono o WhatsApp no válido" };
    }
  }
  if (!SUPPORTED_CURRENCIES.has(settings.currency)) {
    return { error: "Moneda no válida (usa un código ISO 4217, por ejemplo ARS, USD o EUR)" };
  }
  if (!settings.locale || settings.locale.length > 20) {
    return { error: "Idioma/región no válido (por ejemplo es-AR)" };
  }
  if (!settings.timezone || settings.timezone.length > 50 || !isValidTimezone(settings.timezone)) {
    return { error: "Zona horaria no válida (por ejemplo America/Argentina/Buenos_Aires)" };
  }

  if (allowType) {
    if (!STORE_TYPES.includes(type)) {
      return { error: "Tipo de tienda no válido" };
    }
    settings.type = type;
  }

  return { settings };
}

module.exports = { parseBusinessSettings, STORE_TYPES, PHONE_PATTERN };
