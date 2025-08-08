const express = require("express");
const router = express.Router();
const {
  calculatePricing,
  getServices,
  validatePromoCode,
  getPricingConfig,
} = require("../controllers/pricingController");

// @route   POST /api/pricing/calculate
// @desc    Calculate pricing for services
// @access  Public
router.post("/calculate", calculatePricing);

// @route   GET /api/pricing/services
// @desc    Get all available services and pricing
// @access  Public
router.get("/services", getServices);

// @route   POST /api/pricing/validate-promo
// @desc    Validate promo code
// @access  Public
router.post("/validate-promo", validatePromoCode);

// @route   GET /api/pricing/config
// @desc    Get pricing configuration
// @access  Public
router.get("/config", getPricingConfig);

module.exports = router;
