import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Si el usuario está autenticado, redirigir a su tienda
      navigate(`/${user.businessSlug}`);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Ventas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestiona tu tienda en línea de manera fácil y eficiente.
            Crea tu tienda, administra productos y controla tus pedidos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Crear Nueva Tienda */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Crear Nueva Tienda</h2>
              <p className="text-gray-600">
                Registra tu negocio y comienza a vender en línea
              </p>
            </div>
            <Link
              to="/register"
              className="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Comenzar
            </Link>
          </div>

          {/* Iniciar Sesión */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600">
                Accede a tu tienda y gestiona tus pedidos
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full bg-green-600 text-white text-center py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Entrar
            </Link>
          </div>
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Características</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Catálogo de Productos</h4>
              <p className="text-gray-600 text-sm">
                Organiza tus productos por categorías y gestiona tu inventario
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Gestión de Pedidos</h4>
              <p className="text-gray-600 text-sm">
                Controla todos tus pedidos y actualiza su estado en tiempo real
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Panel de Administración</h4>
              <p className="text-gray-600 text-sm">
                Acceso exclusivo para propietarios con herramientas de gestión
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;