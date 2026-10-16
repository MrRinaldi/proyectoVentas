const pool = require("../config/db");

exports.getBusinesses = async (req, res) => {
  try {
    const [businesses] = await pool.query(
      "SELECT id, name, slug, logo, primary_color, whatsapp_number, phone FROM businesses WHERE is_active = TRUE ORDER BY name"
    );

    res.json({ businesses });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tiendas" });
  }
};