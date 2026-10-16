import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import MiniCart from "./MiniCart";
import { getImageUrl } from "../utils/images";

function StoreHeader({ business }) {
  const { selectStore } = useContext(CartContext);
  const { user, isOwner, logout } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  // Todas las páginas de una tienda muestran esta cabecera: aquí se carga el carrito de esa tienda.
  useEffect(() => {
    selectStore(slug);
  }, [slug, selectStore]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="flex flex-wrap justify-between items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm sticky top-0 z-50 border-t-4 border-[var(--brand)]">

  <button onClick={() => navigate(`/${slug}`)} className="flex items-center gap-3 min-w-0">
    {business.logo && (
      <img
        src={getImageUrl(business.logo)}
        alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        className="w-10 h-10 rounded-full object-cover"
      />
    )}
    <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
      {business.name}
    </h1>
  </button>

  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
    {user && isOwner() && (
      <>
        <button
          onClick={() => navigate(`/${slug}/orders`)}
          className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Pedidos
        </button>
        <button
          onClick={() => navigate(`/${slug}/products`)}
          className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Catálogo
        </button>
        <button
          onClick={() => navigate(`/${slug}/settings`)}
          className="bg-purple-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Mi tienda
        </button>
      </>
    )}

    {user ? (
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-sm text-gray-600">
          {user.email}
        </span>
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition text-sm"
        >
          Salir
        </button>
      </div>
    ) : (
      <button
        onClick={() => navigate('/login')}
        className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition text-sm"
      >
        Iniciar Sesión
      </button>
    )}

    <MiniCart business={business} />
  </div>

</header>
  );
}

export default StoreHeader;