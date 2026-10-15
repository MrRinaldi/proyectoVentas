const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.createBusiness = async (req, res) => {
  try {
    const { businessName, email, password, whatsappNumber, phone } = req.body;

    if (!businessName || !email || !password) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Crear slug simple
    const slug = businessName.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Verificar que el slug no exista
    const [existingBusiness] = await pool.query(
      "SELECT id FROM businesses WHERE slug = ?",
      [slug]
    );

    if (existingBusiness.length > 0) {
      return res.status(400).json({ message: "Ya existe una tienda con este nombre" });
    }

    // Crear negocio
    const [businessResult] = await pool.query(
      "INSERT INTO businesses (name, slug, whatsapp_number, phone) VALUES (?, ?, ?, ?)",
      [businessName, slug, whatsappNumber || null, phone || null]
    );

    const businessId = businessResult.insertId;

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario owner
    await pool.query(
      "INSERT INTO users (business_id, email, password, role) VALUES (?, ?, ?, 'owner')",
      [businessId, email, hashedPassword]
    );

    res.status(201).json({
      message: "Tienda creada correctamente",
      business: {
        id: businessId,
        name: businessName,
        slug: slug
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando la tienda" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      "SELECT u.*, b.name as business_name, b.slug as business_slug FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        businessId: user.business_id,
        role: user.role,
        businessName: user.business_name,
        businessSlug: user.business_slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessName: user.business_name,
        businessSlug: user.business_slug,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el login" });
  }
};