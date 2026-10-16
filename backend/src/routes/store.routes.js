const express = require("express");
const router = express.Router();
const storeController = require("../controllers/store.controller");
const ordersController = require("../controllers/orders.controller");
const customersController = require("../controllers/customers.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/:slug", storeController.getStore);
// Abierto a compras sin cuenta; con sesión de cliente, el pedido queda vinculado a su cuenta.
router.post("/:slug/orders", authMiddleware.optionalAuth, ordersController.createOrder);
router.get("/:slug/orders", authMiddleware, authMiddleware.requireStaff, ordersController.getOrders);
router.put("/:slug/orders/:orderId/status", authMiddleware, authMiddleware.requireStaff, ordersController.updateOrderStatus);

// Cuentas de cliente de esta tienda.
router.post("/:slug/customers/register", customersController.register);
router.post("/:slug/customers/login", customersController.login);
router.get("/:slug/customers/me/orders", authMiddleware, authMiddleware.requireCustomer, customersController.myOrders);

module.exports = router;
