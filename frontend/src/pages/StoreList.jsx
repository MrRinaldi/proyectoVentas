import { useState, useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { Link } from "react-router-dom";
import axios from "axios";
import { getImageUrl, showPlaceholderOnError } from "../utils/images";

function StoreList() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/businesses`);
        setBusinesses(response.data.businesses);
      } catch (error) {
        console.error("Error cargando tiendas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando tiendas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Tiendas Disponibles
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Link
              key={business.id}
              to={`/${business.slug}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
            >
              <div className="flex items-center space-x-4">
                {business.logo && (
                  <img
                    src={getImageUrl(business.logo)}
                    alt={business.name}
                    onError={showPlaceholderOnError}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {business.name}
                  </h2>
                  <p className="text-gray-600">
                    @{business.slug}
                  </p>
                  {business.phone && (
                    <p className="text-sm text-gray-500">
                      📞 {business.phone}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay tiendas disponibles en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreList;