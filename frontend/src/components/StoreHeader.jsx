import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import MiniCart from "./MiniCart";

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
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-50">

  <h1 className="text-2xl font-bold tracking-tight">
    {business.name}
  </h1>

  <div className="flex items-center gap-4">
    {user && isOwner() && (
      <>
        <button
          onClick={() => navigate(`/${slug}/orders`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Ver Órdenes
        </button>
        <button
          onClick={() => navigate(`/${slug}/products`)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Administrar Artículos
        </button>
      </>
    )}

    {user ? (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
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

    <MiniCart />
  </div>

</header>
  );
}

export default StoreHeader;