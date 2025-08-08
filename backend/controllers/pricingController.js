const { pricingHelpers, pricingConfig } = require("../config/pricing");

// @desc    Calculate pricing for services
// @route   POST /api/pricing/calculate
// @access  Public
const calculatePricing = async (req, res) => {
  try {
    const {
      selectedServiceId,
      selectedExtras = [],
      vehicleType = "sedan",
      frequency = "one-time",
      promoCode,
    } = req.body;

    // Map frontend service IDs to service names
    const serviceMapping = {
      1: "Interior Only",
      2: "Exterior Only",
      3: "Full Detail",
    };

    const selectedServiceName = serviceMapping[selectedServiceId];
    if (!selectedServiceName) {
      return res.status(400).json({
        success: false,
        message: "Invalid service selected",
      });
    }

    // Prepare services array for calculation
    const services = [
      {
        name: selectedServiceName,
        quantity: 1,
      },
    ];

    // Prepare addons array for calculation
    const addons = selectedExtras.map((extra) => ({
      name: extra,
      quantity: 1,
    }));

    // Calculate base pricing
    const pricing = pricingHelpers.calculateTotalPrice(
      services,
      addons,
      vehicleType,
      frequency
    );

    // Apply promo code if provided
    let promoCodeValidation = null;
    if (promoCode) {
      promoCodeValidation = pricingHelpers.validatePromoCode(
        promoCode,
        pricing.subtotal
      );
    }

    // Calculate final total with promo code
    let finalTotal = pricing.total;
    let finalDiscount = pricing.frequencyDiscount;

    if (promoCodeValidation?.valid) {
      finalTotal = pricing.total - promoCodeValidation.discountAmount;
      finalDiscount += promoCodeValidation.discountAmount;
    }

    const response = {
      success: true,
      data: {
        pricing: {
          ...pricing,
          total: Math.round(finalTotal * 100) / 100,
          finalDiscount: Math.round(finalDiscount * 100) / 100,
        },
        serviceDetails: {
          name: selectedServiceName,
          ...pricingConfig.services[selectedServiceName],
        },
        addonDetails: selectedExtras.map((extra) => ({
          name: extra,
          ...pricingConfig.addons[extra],
        })),
        promoCodeValidation,
        vehicleType,
        frequency,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Pricing calculation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate pricing",
    });
  }
};

// @desc    Get all available services and pricing
// @route   GET /api/pricing/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { vehicleType = "sedan" } = req.query;

    const services = Object.keys(pricingConfig.services).map((serviceName) => {
      const service = pricingConfig.services[serviceName];
      const price = pricingHelpers.calculateSeasonalPrice(
        serviceName,
        vehicleType
      );

      return {
        name: serviceName,
        basePrice: service.basePrice,
        currentPrice: price,
        duration: service.duration,
        category: service.category,
        description: service.description,
        features: service.features,
        vehicleTypePricing: service.vehicleTypePricing,
      };
    });

    const addons = Object.keys(pricingConfig.addons).map((addonName) => {
      const addon = pricingConfig.addons[addonName];
      const price = pricingHelpers.calculateSeasonalPrice(
        addonName,
        vehicleType
      );

      return {
        name: addonName,
        basePrice: addon.basePrice,
        currentPrice: price,
        duration: addon.duration,
        category: addon.category,
        description: addon.description,
        canCombineWith: addon.canCombineWith,
      };
    });

    res.json({
      success: true,
      data: {
        services,
        addons,
        frequency: pricingConfig.frequency,
        seasonal: pricingConfig.seasonal,
        currentSeason: pricingHelpers.getCurrentSeason(),
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get services",
    });
  }
};

// @desc    Validate promo code
// @route   POST /api/pricing/validate-promo
// @access  Public
const validatePromoCode = async (req, res) => {
  try {
    const { promoCode, subtotal, serviceIds = [] } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required",
      });
    }

    const validation = pricingHelpers.validatePromoCode(
      promoCode,
      subtotal,
      serviceIds
    );

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate promo code",
    });
  }
};

// @desc    Get pricing configuration
// @route   GET /api/pricing/config
// @access  Public
const getPricingConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        minimumBooking: pricingConfig.minimumBooking,
        taxRate: pricingConfig.taxRate,
        cancellationPolicy: pricingConfig.cancellationPolicy,
        currentSeason: pricingHelpers.getCurrentSeason(),
      },
    });
  } catch (error) {
    console.error("Get pricing config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pricing configuration",
    });
  }
};

module.exports = {
  calculatePricing,
  getServices,
  validatePromoCode,
  getPricingConfig,
};
