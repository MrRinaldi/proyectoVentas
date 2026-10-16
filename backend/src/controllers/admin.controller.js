// Panel del superadministrador: gestión de todas las tiendas de la plataforma.
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { parseBusinessSettings, STORE_TYPES, PHONE_PATTERN } = require("../utils/businessSettings");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// URLs del frontend que una tienda no puede usar como slug.
const RESERVED_SLUGS = ["admin", "login", "api"];

// "Perfumería Elegancia" -> "perfumeria-elegancia"
function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Devuelve un mensaje de error si los datos de la tienda nueva no son válidos, o null si lo son.
function validateNewBusiness({ businessName, type, ownerEmail, ownerPassword, whatsappNumber, phone }) {
  if (typeof businessName !== "string" || businessName.trim().length < 2 || businessName.trim().length > 150) {
    return "El nombre de la tienda debe tener entre 2 y 150 caracteres";
  }
  if (!slugify(businessName)) {
    return "El nombre de la tienda debe contener letras o números";
  }
  if (RESERVED_SLUGS.includes(slugify(businessName))) {
    return "Ese nombre de tienda no está permitido";
  }
  if (type !== undefined && !STORE_TYPES.includes(type)) {
    return "Tipo de tienda no válido";
  }
  if (typeof ownerEmail !== "string" || !EMAIL_PATTERN.test(ownerEmail) || ownerEmail.length > 150) {
    return "Email del administrador no válido";
  }
  if (typeof ownerPassword !== "string" || ownerPassword.length < 8) {
    return "La contraseña del administrador debe tener al menos 8 caracteres";
  }
  for (const value of [whatsappNumber, phone]) {
    if (value && (typeof value !== "string" || !PHONE_PATTERN.test(value.trim()))) {
      return "Teléfono o WhatsApp no válido";
    }
  }
  return null;
}

exports.listBusinesses = async (req, res) => {
  try {
    const [businesses] = await pool.query(`
      SELECT
        b.id, b.name, b.slug, b.type, b.logo, b.primary_color, b.whatsapp_number, b.phone,
        b.currency, b.locale, b.is_active, b.created_at,
        (SELECT u.email FROM users u WHERE u.business_id = b.id AND u.role = 'owner' ORDER BY u.id LIMIT 1) AS owner_email,
        (SELECT COUNT(*) FROM products p WHERE p.business_id = b.id) AS product_count,
        (SELECT COUNT(*) FROM orders o WHERE o.business_id = b.id) AS order_count
      FROM businesses b
      ORDER BY b.name
    `);

    res.json({ businesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tiendas" });
  }
};

exports.createBusiness = async (req, res) => {
  let connection;
  try {
    const validationError = validateNewBusiness(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const businessName = req.body.businessName.trim();
    const slug = slugify(businessName);
    const type = req.body.type || "grocery";
    const ownerEmail = req.body.ownerEmail.trim().toLowerCase();
    const whatsappNumber = req.body.whatsappNumber?.trim() || null;
    const phone = req.body.phone?.trim() || null;

    const [existingBusiness] = await pool.query("SELECT id FROM businesses WHERE slug = ?", [slug]);
    if (existingBusiness.length > 0) {
      return res.status(409).json({ message: "Ya existe una tienda con ese nombre" });
    }

    const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ?", [ownerEmail]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Ese email ya está en uso" });
    }

    const hashedPassword = await bcrypt.hash(req.body.ownerPassword, 10);

    // Tienda y su administrador en una transacción: o se crean los dos o ninguno.
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [businessResult] = await connection.query(
      "INSERT INTO businesses (name, slug, type, whatsapp_number, phone) VALUES (?, ?, ?, ?, ?)",
      [businessName, slug, type, whatsappNumber, phone]
    );

    await connection.query(
      "INSERT INTO users (business_id, email, password, role) VALUES (?, ?, ?, 'owner')",
      [businessResult.insertId, ownerEmail, hashedPassword]
    );

    await connection.commit();

    res.status(201).json({
      message: "Tienda creada correctamente",
      business: { id: businessResult.insertId, name: businessName, slug },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({ message: "Error creando la tienda" });
  } finally {
    if (connection) connection.release();
  }
};

// Configuración de cualquier tienda (las mismas reglas que "Mi tienda", más el tipo de tienda).
exports.updateBusiness = async (req, res) => {
  try {
    const { error, settings } = parseBusinessSettings(req.body, { allowType: true });
    if (error) {
      return res.status(400).json({ message: error });
    }

    const [result] = await pool.query(
      `UPDATE businesses
       SET name = ?, type = ?, logo = ?, primary_color = ?, whatsapp_number = ?, phone = ?, currency = ?, locale = ?
       WHERE id = ?`,
      [settings.name, settings.type, settings.logo, settings.primary_color, settings.whatsapp_number,
        settings.phone, settings.currency, settings.locale, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    res.json({ message: "Configuración guardada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error guardando la configuración" });
  }
};

// Suspende (isActive: false) o reactiva (isActive: true) una tienda.
exports.setBusinessStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive debe ser true o false" });
    }

    const [result] = await pool.query(
      "UPDATE businesses SET is_active = ? WHERE id = ?",
      [isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    res.json({ message: isActive ? "Tienda reactivada" : "Tienda suspendida" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando la tienda" });
  }
};
