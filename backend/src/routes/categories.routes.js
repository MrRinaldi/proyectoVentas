const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const categoriesController = require("../controllers/categories.controller");

router.get("/", authMiddleware, authMiddleware.requireStaff, categoriesController.getCategories);
router.post("/", authMiddleware, authMiddleware.requireStaff, categoriesController.createCategory);
router.put("/:id", authMiddleware, authMiddleware.requireStaff, categoriesController.updateCategory);
router.delete("/:id", authMiddleware, authMiddleware.requireStaff, categoriesController.deleteCategory);

module.exports = router;