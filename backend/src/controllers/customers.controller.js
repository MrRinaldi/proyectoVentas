// Clientes finales: cuenta propia en cada tienda (registro, inicio de sesión y sus pedidos),
// y la lista de clientes que ve el personal de la tienda.
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PHONE_PATTERN } = require("../utils/businessSettings");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findActiveBusiness(slug) {
  const [businesses] = await pool.query(
    "SELECT id, slug FROM businesses WHERE slug = ? AND is_active = TRUE",
    [slug]
  );
  return businesses[0] || null;
}

// Token de cliente: sirve solo en su tienda (role "customer", no tiene permisos de gestión).
function customerSession(customer, business) {
  const token = jwt.sign(
    { customerId: customer.id, businessId: business.id, businessSlug: business.slug, role: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
  return {
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  };
}

// Devuelve un mensaje de error si los datos de registro no son válidos, o null si lo son.
function validateRegistration({ name, email, phone, password }) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
    return "El nombre debe tener entre 1 y 150 caracteres";
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()) || email.length > 150) {
    return "Email no válido";
  }
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone.trim())) {
    return "Teléfono no válido";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  return null;
}

exports.register = async (req, res) => {
  try {
    const business = await findActiveBusiness(req.params.slug);
    if (!business) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const validationError = validateRegistration(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone.trim();

    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE business_id = ? AND email = ?",
      [business.id, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Ya existe una cuenta con ese email en esta tienda" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const [result] = await pool.query(
      "INSERT INTO customers (business_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)",
      [business.id, name, email, phone, hashedPassword]
    );

    res.status(201).json(customerSession({ id: result.insertId, name, email, phone }, business));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando la cuenta" });
  }
};

exports.login = async (req, res) => {
  try {
    const business = await findActiveBusiness(req.params.slug);
    if (!business) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const [customers] = await pool.query(
      "SELECT * FROM customers WHERE business_id = ? AND email = ?",
      [business.id, email.trim().toLowerCase()]
    );
    const customer = customers[0];

    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    res.json(customerSession(customer, business));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error iniciando sesión" });
  }
};

// Pedidos del cliente con sesión, solo de esta tienda.
exports.myOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.id, o.total, o.currency, o.status, o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'options', oi.options
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ? AND o.business_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
    `, [req.user.customerId, req.user.businessId]);

    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo tus pedidos" });
  }
};

// Clientes registrados de la tienda del personal que hace la petición.
exports.listCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT
        c.id, c.name, c.email, c.phone, c.created_at,
        COUNT(o.id) AS order_count,
        MAX(o.created_at) AS last_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.business_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [req.user.businessId]);

    res.json({ customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo clientes" });
  }
};
