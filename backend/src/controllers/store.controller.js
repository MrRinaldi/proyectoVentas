const pool = require("../config/db");

exports.getStore = async (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar negocio
    const [businesses] = await pool.query(
      "SELECT id, name, type, logo, primary_color, whatsapp_number, currency, locale FROM businesses WHERE slug = ? AND is_active = TRUE",
      [slug]
    );

    if (businesses.length === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const business = businesses[0];

    // Obtener categorías
    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE business_id = ?",
      [business.id]
    );

    // Obtener productos activos
    const [products] = await pool.query(
      "SELECT * FROM products WHERE business_id = ? AND is_active = TRUE",
      [business.id]
    );

    res.json({
      business,
      categories,
      products
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tienda" });
  }
};