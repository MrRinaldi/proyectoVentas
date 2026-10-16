const express = require("express");
const router = express.Router();
const storeController = require("../controllers/store.controller");
const ordersController = require("../controllers/orders.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/:slug", storeController.getStore);
router.post("/:slug/orders", ordersController.createOrder);
router.get("/:slug/orders", authMiddleware, authMiddleware.requireStaff, ordersController.getOrders);
router.put("/:slug/orders/:orderId/status", authMiddleware, authMiddleware.requireStaff, ordersController.updateOrderStatus);

module.exports = router;