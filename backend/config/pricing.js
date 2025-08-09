const pricingConfig = {
  // Base service pricing
  services: {
    "Interior Only": {
      basePrice: 30.0,
      duration: 120, // 2 hours
      category: "interior",
      description: "Deep Clean Seats, Carpets, Panels, And More.",
      features: [
        "Vacuum and steam clean seats",
        "Clean and condition leather/vinyl",
        "Detail dashboard and console",
        "Clean door panels and handles",
        "Vacuum and clean carpets",
        "Clean windows and mirrors",
        "Deodorize interior",
      ],
      vehicleTypePricing: {
        sedan: 0,
        suv: 25,
        truck: 35,
        luxury: 50,
        other: 15,
      },
    },
    "Exterior Only": {
      basePrice: 20.0,
      duration: 90, // 1.5 hours
      category: "exterior",
      description: "Wash, Polish, And Protect Your Car's Exterior.",
      features: [
        "Hand wash with premium soap",
        "Clay bar treatment",
        "Paint correction (light)",
        "Wax application",
        "Tire and wheel cleaning",
        "Trim restoration",
        "Glass cleaning",
      ],
      vehicleTypePricing: {
        sedan: 0,
        suv: 30,
        truck: 40,
        luxury: 60,
        other: 20,
      },
    },
    "Full Detail": {
      basePrice: 80.0,
      duration: 240, // 4 hours
      category: "full",
      description: "Complete Interior And Exterior Service.",
      features: [
        "Complete interior cleaning",
        "Complete exterior detailing",
        "Engine bay cleaning",
        "Paint protection",
        "Interior protection",
        "Premium wax application",
        "Tire dressing",
      ],
      vehicleTypePricing: {
        sedan: 0,
        suv: 50,
        truck: 70,
        luxury: 100,
        other: 30,
      },
    },
  },

  // Add-on services pricing
  addons: {
    "Wax & Polish": {
      basePrice: 25.0,
      duration: 45,
      category: "addon",
      description: "Premium wax application for long-lasting protection",
      canCombineWith: ["Interior Only", "Exterior Only", "Full Detail"],
    },
    "Engine Bay Cleaning": {
      basePrice: 35.0,
      duration: 30,
      category: "addon",
      description: "Clean and degrease engine compartment",
      canCombineWith: ["Exterior Only", "Full Detail"],
    },
    "Pet Hair Removal": {
      basePrice: 20.0,
      duration: 20,
      category: "addon",
      description: "Specialized pet hair removal from upholstery",
      canCombineWith: ["Interior Only", "Full Detail"],
    },
    "Odor Elimination": {
      basePrice: 30.0,
      duration: 15,
      category: "addon",
      description: "Professional odor removal treatment",
      canCombineWith: ["Interior Only", "Full Detail"],
    },
    "Headlight Restoration": {
      basePrice: 40.0,
      duration: 60,
      category: "addon",
      description: "Restore cloudy headlights to like-new condition",
      canCombineWith: ["Exterior Only", "Full Detail"],
    },
  },

  // Frequency-based pricing
  frequency: {
    "one-time": {
      multiplier: 1.0,
      description: "One-time service",
    },
    weekly: {
      multiplier: 0.8, // 20% discount
      description: "Weekly service - 20% discount",
    },
    "bi-weekly": {
      multiplier: 0.85, // 15% discount
      description: "Bi-weekly service - 15% discount",
    },
  },

  // Seasonal pricing multipliers
  seasonal: {
    spring: {
      multiplier: 1.0,
      startDate: "2024-03-20",
      endDate: "2024-06-20",
    },
    summer: {
      multiplier: 1.1, // 10% premium
      startDate: "2024-06-21",
      endDate: "2024-09-22",
    },
    fall: {
      multiplier: 1.0,
      startDate: "2024-09-23",
      endDate: "2024-12-20",
    },
    winter: {
      multiplier: 0.95, // 5% discount
      startDate: "2024-12-21",
      endDate: "2024-03-19",
    },
  },

  // Minimum booking amount
  minimumBooking: 50.0,

  // Tax rate (can be configured per location)
  taxRate: 0.08, // 8%

  // Cancellation policy
  cancellationPolicy: {
    fullRefundHours: 24, // Full refund if cancelled 24+ hours before
    partialRefundHours: 12, // Partial refund if cancelled 12+ hours before
    partialRefundPercentage: 0.5, // 50% refund
  },
};

// Pricing helper functions
const pricingHelpers = {
  // Get current season for seasonal pricing
  getCurrentSeason: () => {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 8) return "peak"; // April to September
    return "off-peak"; // October to March
  },

  // Calculate base price for a service
  calculateBasePrice: (serviceName) => {
    const service =
      pricingConfig.services[serviceName] || pricingConfig.addons[serviceName];
    if (!service) {
      console.warn(`Service not found: ${serviceName}`);
      return 0;
    }

    // Return only the base price, ignoring vehicle type adjustments
    return service.basePrice || 0;
  },

  // Calculate seasonal price adjustment
  calculateSeasonalPrice: (serviceName) => {
    const basePrice = pricingHelpers.calculateBasePrice(serviceName);
    const currentSeason = pricingHelpers.getCurrentSeason();

    // Apply seasonal adjustments
    const seasonalMultiplier = currentSeason === "peak" ? 1.1 : 0.9;
    return Math.round(basePrice * seasonalMultiplier * 100) / 100;
  },

  // Calculate frequency-based pricing
  calculateFrequencyPrice: (basePrice, frequency = "one-time") => {
    const frequencyConfig = {
      "one-time": { multiplier: 1.0 },
      weekly: { multiplier: 0.8 }, // 20% discount
      "bi-weekly": { multiplier: 0.85 }, // 15% discount
      monthly: { multiplier: 0.95 }, // 5% discount
    };

    const config = frequencyConfig[frequency] || frequencyConfig["one-time"];
    return basePrice * config.multiplier;
  },

  // Calculate total price for a booking
  calculateTotalPrice: (services, addons, frequency = "one-time") => {
    let subtotal = 0;

    // Calculate service prices
    services.forEach((service) => {
      const servicePrice = pricingHelpers.calculateSeasonalPrice(service.name);
      subtotal += servicePrice * (service.quantity || 1);
    });

    // Calculate addon prices
    addons.forEach((addon) => {
      const addonPrice = pricingHelpers.calculateSeasonalPrice(addon.name);
      subtotal += addonPrice * (addon.quantity || 1);
    });

    // Apply frequency discount
    const discountedPrice = pricingHelpers.calculateFrequencyPrice(
      subtotal,
      frequency
    );

    // Calculate tax
    const tax = discountedPrice * pricingConfig.taxRate;
    const total = discountedPrice + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountedSubtotal: Math.round(discountedPrice * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      frequencyDiscount: Math.round((subtotal - discountedPrice) * 100) / 100,
    };
  },

  // Validate promo code discount
  validatePromoCode: (promoCode, subtotal, serviceIds = []) => {
    // This would integrate with your existing promo code system
    // For now, return a simple validation
    const validPromoCodes = {
      WELCOME10: { discount: 0.1, minAmount: 50 },
      SAVE20: { discount: 0.2, minAmount: 100 },
      NEWCUSTOMER: { discount: 0.15, minAmount: 75 },
    };

    const promo = validPromoCodes[promoCode?.toUpperCase()];
    if (!promo) return { valid: false, message: "Invalid promo code" };
    if (subtotal < promo.minAmount)
      return {
        valid: false,
        message: `Minimum order amount is $${promo.minAmount}`,
      };

    const discountAmount = subtotal * promo.discount;
    const finalAmount = subtotal - discountAmount;

    return {
      valid: true,
      message: `${promo.discount * 100}% discount applied!`,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
    };
  },

  // Get all available services
  getAvailableServices: () => {
    return {
      services: Object.keys(pricingConfig.services),
      addons: Object.keys(pricingConfig.addons),
    };
  },

  // Get service details
  getServiceDetails: (serviceName) => {
    return (
      pricingConfig.services[serviceName] || pricingConfig.addons[serviceName]
    );
  },
};

module.exports = {
  pricingConfig,
  pricingHelpers,
};
