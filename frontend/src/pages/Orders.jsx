import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import StoreLayout from "../components/StoreLayout";
import StoreHeader from "../components/StoreHeader";

function Orders() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isOwner, logout } = useAuth();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación y permisos
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isOwner()) {
      navigate(`/${slug}`);
      return;
    }

    // Obtener datos de la tienda
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}`)
      .then(res => res.json())
      .then(data => setStore(data));

    // Obtener órdenes con token de autenticación
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/store/${slug}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        // Token caducado o inválido: al cerrar sesión, este efecto redirige al login.
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando órdenes:', error);
        setLoading(false);
      });
  }, [slug, user, isOwner, logout, navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/store/${slug}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Actualizar el estado local
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        ));
      } else {
        alert('Error actualizando el estado de la orden');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error actualizando el estado de la orden');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!store || loading) return <p className="p-4">Cargando...</p>;

  return (
    <StoreLayout>
      <StoreHeader business={store.business} />

      <div className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center mb-6">
          <h2 className="text-2xl font-bold">Órdenes</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              ← Volver a la tienda
            </button>
            <button
              onClick={() => navigate(`/${slug}/products`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Administrar artículos
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay órdenes aún</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Orden #{order.id}</h3>
                    <p className="text-gray-600">{order.customer_name}</p>
                    <p className="text-gray-600">{order.customer_phone}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-xl font-bold mt-2">${order.total}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Productos:</h4>
                  <div className="space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      >
                        Marcar como entregada
                      </button>
                    )}
                    {order.status !== 'cancelled' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </StoreLayout>
  );
}

export default Orders;