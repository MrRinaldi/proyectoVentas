const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    // LEFT JOIN: el superadministrador no pertenece a ninguna tienda.
    const [users] = await pool.query(
      `SELECT u.*, b.name AS business_name, b.slug AS business_slug, b.is_active AS business_is_active
       FROM users u LEFT JOIN businesses b ON u.business_id = b.id
       WHERE u.email = ?`,
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

    if (user.role !== "superadmin" && !user.business_is_active) {
      return res.status(403).json({ message: "Esta tienda está suspendida. Contacta con el administrador de la plataforma." });
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
