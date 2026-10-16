const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const statsController = require("../controllers/stats.controller");

// Estadísticas de la tienda del personal que hace la petición. ?days=7|30|90 (por defecto 30).
router.get("/", authMiddleware, authMiddleware.requireStaff, statsController.getStats);

module.exports = router;
