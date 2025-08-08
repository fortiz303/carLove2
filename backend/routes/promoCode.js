const express = require("express");
const router = express.Router();
const {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  getPromoCodeStats,
} = require("../controllers/promoCodeController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Admin routes
router.post(
  "/admin/promo-codes",
  authenticateToken,
  requireAdmin,
  createPromoCode
);
router.get(
  "/admin/promo-codes",
  authenticateToken,
  requireAdmin,
  getAllPromoCodes
);
router.get(
  "/admin/promo-codes/stats",
  authenticateToken,
  requireAdmin,
  getPromoCodeStats
);
router.get(
  "/admin/promo-codes/:id",
  authenticateToken,
  requireAdmin,
  getPromoCodeById
);
router.put(
  "/admin/promo-codes/:id",
  authenticateToken,
  requireAdmin,
  updatePromoCode
);
router.delete(
  "/admin/promo-codes/:id",
  authenticateToken,
  requireAdmin,
  deletePromoCode
);

// User routes
router.post("/promo-codes/validate", authenticateToken, validatePromoCode);

module.exports = router;
