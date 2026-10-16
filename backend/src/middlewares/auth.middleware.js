const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // userId, businessId, role, businessName, businessSlug
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// Personal de una tienda (owner o admin) cuya tienda no está suspendida.
// La suspensión se comprueba en cada petición para que tenga efecto inmediato,
// sin esperar a que caduque el token.
const requireStaff = async (req, res, next) => {
  if ((req.user.role !== "owner" && req.user.role !== "admin") || !req.user.businessId) {
    return res.status(403).json({ message: "Acceso denegado." });
  }

  try {
    const [businesses] = await pool.query(
      "SELECT is_active FROM businesses WHERE id = ?",
      [req.user.businessId]
    );
    if (businesses.length === 0 || !businesses[0].is_active) {
      return res.status(403).json({ message: "Esta tienda está suspendida." });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Superadministrador de la plataforma.
const requireSuperadmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Acceso denegado." });
  }
  next();
};

// Para rutas públicas que se comportan distinto con sesión (p. ej. el checkout vincula el pedido al
// cliente). Si el token falta o no es válido, la petición sigue como anónima.
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token caducado o inválido: se trata como compra sin cuenta.
    }
  }
  next();
};

// Cliente final con sesión en la tienda de la URL (/api/store/:slug/...).
const requireCustomer = (req, res, next) => {
  if (req.user.role !== "customer" || req.user.businessSlug !== req.params.slug) {
    return res.status(403).json({ message: "Acceso denegado." });
  }
  next();
};

module.exports.requireStaff = requireStaff;
module.exports.requireSuperadmin = requireSuperadmin;
module.exports.optionalAuth = optionalAuth;
module.exports.requireCustomer = requireCustomer;
