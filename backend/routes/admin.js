const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Admin dashboard statistics
router.get("/dashboard", authenticateToken, requireAdmin, getDashboardStats);

module.exports = router;
