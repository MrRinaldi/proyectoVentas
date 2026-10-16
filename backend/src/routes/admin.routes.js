const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

// Todas las rutas de este archivo son solo para el superadministrador.
router.use(authMiddleware, authMiddleware.requireSuperadmin);

router.get("/businesses", adminController.listBusinesses);
router.post("/businesses", adminController.createBusiness);
router.put("/businesses/:id", adminController.updateBusiness);
router.patch("/businesses/:id/status", adminController.setBusinessStatus);

module.exports = router;
