import { useContext, useState } from "react";
import { formatPrice } from "../utils/money";
import { Link, useParams } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";

function CheckoutModal({ isOpen, onClose, business }) {
  const { cart, checkout, total } = useContext(CartContext);
  const { slug } = useParams();
  const { getSession } = useCustomer();
  // Con sesión de cliente, nombre y teléfono salen de su cuenta y el pedido queda en "Mis pedidos".
  const session = getSession(slug);
  const [customerName, setCustomerName] = useState(session?.customer.name || '');
  const [customerPhone, setCustomerPhone] = useState(session?.customer.phone || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await checkout(slug, customerName, customerPhone, session?.token);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCustomerName(session?.customer.name || '');
        setCustomerPhone(session?.customer.phone || '');
      }, 3000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Pedido realizado!</h3>
            <p className="text-gray-600">Tu pedido ha sido enviado correctamente. El vendedor te contactará pronto.</p>
            {session && <p className="text-gray-600 mt-2 text-sm">Puedes seguirlo en "Mis pedidos".</p>}
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completar Pedido</h3>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Resumen del pedido:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity, business)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2 font-semibold">
                Total: {formatPrice(total, business)}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {session ? (
                <p className="text-sm text-gray-600">Comprando como <strong>{session.customer.email}</strong>.</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Puedes comprar sin cuenta o <Link to={`/${slug}/cuenta`} className="text-blue-600 underline">entrar</Link> para guardar tus pedidos.
                </p>
              )}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--brand)] text-white py-2 px-4 rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;