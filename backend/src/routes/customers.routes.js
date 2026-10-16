const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const customersController = require("../controllers/customers.controller");

// Lista de clientes registrados para el personal de la tienda.
router.get("/", authMiddleware, authMiddleware.requireStaff, customersController.listCustomers);

module.exports = router;
