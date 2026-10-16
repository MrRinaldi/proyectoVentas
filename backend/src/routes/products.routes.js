const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const productsController = require("../controllers/products.controller");

router.get("/", authMiddleware, authMiddleware.requireStaff, productsController.getProducts);
router.post("/", authMiddleware, authMiddleware.requireStaff, productsController.createProduct);
router.put("/:id", authMiddleware, authMiddleware.requireStaff, productsController.updateProduct);
router.delete("/:id", authMiddleware, authMiddleware.requireStaff, productsController.deleteProduct);

module.exports = router;