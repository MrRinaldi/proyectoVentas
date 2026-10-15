// Imagen que se muestra cuando un producto o tienda no tiene imagen o el archivo no existe.
export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

// Convierte la ruta guardada en la base de datos en una URL que el navegador pueda cargar:
// - "https://..." (introducida en el formulario de productos): se usa tal cual.
// - "/api/images/..." (archivo servido por el backend): se le antepone la URL del backend.
// - "foto.jpg" (solo el nombre): se busca en la carpeta de imágenes del backend.
export function getImageUrl(path) {
  if (!path) return PLACEHOLDER_IMAGE;
  if (/^https?:\/\//.test(path)) return path;
  const relativePath = path.startsWith("/") ? path : `/api/images/${path}`;
  return `${import.meta.env.VITE_API_URL}${relativePath}`;
}

// onError de <img>: si el archivo no carga, muestra la imagen de reserva (una sola vez).
export function showPlaceholderOnError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PLACEHOLDER_IMAGE;
}
