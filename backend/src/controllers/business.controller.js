const pool = require("../config/db");
const { parseBusinessSettings } = require("../utils/businessSettings");

// Campos de configuración que ve el administrador de la tienda (y el superadmin).
const SETTINGS_COLUMNS = "id, name, slug, type, logo, primary_color, whatsapp_number, phone, currency, locale, timezone";

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

// "Mi tienda": configuración de la tienda del usuario que hace la petición.
exports.getMyBusiness = async (req, res) => {
  try {
    const [businesses] = await pool.query(
      `SELECT ${SETTINGS_COLUMNS} FROM businesses WHERE id = ?`,
      [req.user.businessId]
    );
    res.json({ business: businesses[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo la tienda" });
  }
};

exports.updateMyBusiness = async (req, res) => {
  try {
    const { error, settings } = parseBusinessSettings(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    await pool.query(
      `UPDATE businesses
       SET name = ?, logo = ?, primary_color = ?, whatsapp_number = ?, phone = ?, currency = ?, locale = ?, timezone = ?
       WHERE id = ?`,
      [settings.name, settings.logo, settings.primary_color, settings.whatsapp_number, settings.phone,
        settings.currency, settings.locale, settings.timezone, req.user.businessId]
    );

    res.json({ message: "Configuración guardada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error guardando la configuración" });
  }
};
