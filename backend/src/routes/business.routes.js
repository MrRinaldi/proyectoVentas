const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const businessController = require("../controllers/business.controller");

router.get("/", businessController.getBusinesses);
router.get("/mine", authMiddleware, authMiddleware.requireStaff, businessController.getMyBusiness);
router.put("/mine", authMiddleware, authMiddleware.requireStaff, businessController.updateMyBusiness);

module.exports = router;
