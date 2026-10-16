// Color por defecto si la tienda no configuró uno (azul).
const DEFAULT_BRAND_COLOR = "#2563eb";

// Envuelve las páginas de una tienda y define su color de marca como variable CSS (--brand).
// Los componentes lo usan con clases como "bg-[var(--brand)]".
function StoreLayout({ business, children }) {
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ "--brand": business?.primary_color || DEFAULT_BRAND_COLOR }}
    >
      {children}
    </div>
  );
}

export default StoreLayout;
