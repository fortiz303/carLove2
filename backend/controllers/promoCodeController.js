const PromoCode = require("../models/PromoCode");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");

/**
 * Create a new promo code (Admin only)
 * @route POST /api/admin/promo-codes
 * @access Private (Admin only)
 */
const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      maxUsage,
      maxUsagePerUser,
      validFrom,
      validUntil,
      applicableServices,
      applicableUsers,
      excludedUsers,
      isActive,
    } = req.body;

    // Check if promo code already exists
    const existingPromoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
    });
    if (existingPromoCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code already exists",
      });
    }

    // Validate discount value based on type
    if (type === "percentage" && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    if (type === "fixed" && value < 0) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount amount cannot be negative",
      });
    }

    // Validate dates
    if (new Date(validFrom) >= new Date(validUntil)) {
      return res.status(400).json({
        success: false,
        message: "Valid until date must be after valid from date",
      });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value: type === "fixed" ? value * 100 : value, // Convert to cents for fixed amount
      minimumOrderAmount: minimumOrderAmount ? minimumOrderAmount * 100 : 0, // Convert to cents
      maximumDiscountAmount: maximumDiscountAmount
        ? maximumDiscountAmount * 100
        : null, // Convert to cents
      maxUsage,
      maxUsagePerUser,
      validFrom,
      validUntil,
      applicableServices,
      applicableUsers,
      excludedUsers,
      isActive,
      createdBy: req.user._id,
    });

    await promoCode.save();

    res.status(201).json({
      success: true,
      message: "Promo code created successfully",
      data: { promoCode },
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create promo code",
    });
  }
};

/**
 * Get all promo codes (Admin only)
 * @route GET /api/admin/promo-codes
 * @access Private (Admin only)
 */
const getAllPromoCodes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Search by code or name
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status === "active") {
      query.isActive = true;
      query.validFrom = { $lte: new Date() };
      query.validUntil = { $gte: new Date() };
    } else if (status === "inactive") {
      query.$or = [{ isActive: false }, { validUntil: { $lt: new Date() } }];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const promoCodeQuery = PromoCode.find(query)
      .populate("applicableServices", "name")
      .populate("applicableUsers", "fullName email")
      .populate("excludedUsers", "fullName email")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    const [promoCodes, total] = await Promise.all([
      promoCodeQuery.skip(skip).limit(parseInt(limit)),
      PromoCode.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        promoCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo codes",
    });
  }
};

/**
 * Get promo code by ID (Admin only)
 * @route GET /api/admin/promo-codes/:id
 * @access Private (Admin only)
 */
const getPromoCodeById = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate("applicableServices", "name")
      .populate("applicableUsers", "fullName email")
      .populate("excludedUsers", "fullName email")
      .populate("createdBy", "fullName")
      .populate("usageHistory.user", "fullName email")
      .populate(
        "usageHistory.booking",
        "scheduledDate scheduledTime totalAmount"
      );

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    res.json({
      success: true,
      data: { promoCode },
    });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo code",
    });
  }
};

/**
 * Update promo code (Admin only)
 * @route PUT /api/admin/promo-codes/:id
 * @access Private (Admin only)
 */
const updatePromoCode = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      maxUsage,
      maxUsagePerUser,
      validFrom,
      validUntil,
      applicableServices,
      applicableUsers,
      excludedUsers,
      isActive,
    } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // Check if code is being changed and if new code already exists
    if (code && code.toUpperCase() !== promoCode.code) {
      const existingPromoCode = await PromoCode.findOne({
        code: code.toUpperCase(),
      });
      if (existingPromoCode) {
        return res.status(400).json({
          success: false,
          message: "Promo code already exists",
        });
      }
    }

    // Validate discount value based on type
    if (type === "percentage" && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    if (type === "fixed" && value < 0) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount amount cannot be negative",
      });
    }

    // Validate dates
    if (
      validFrom &&
      validUntil &&
      new Date(validFrom) >= new Date(validUntil)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid until date must be after valid from date",
      });
    }

    // Update fields
    if (code) promoCode.code = code.toUpperCase();
    if (name) promoCode.name = name;
    if (description !== undefined) promoCode.description = description;
    if (type) promoCode.type = type;
    if (value !== undefined) {
      promoCode.value = type === "fixed" ? value * 100 : value;
    }
    if (minimumOrderAmount !== undefined) {
      promoCode.minimumOrderAmount = minimumOrderAmount * 100;
    }
    if (maximumDiscountAmount !== undefined) {
      promoCode.maximumDiscountAmount = maximumDiscountAmount
        ? maximumDiscountAmount * 100
        : null;
    }
    if (maxUsage !== undefined) promoCode.maxUsage = maxUsage;
    if (maxUsagePerUser !== undefined)
      promoCode.maxUsagePerUser = maxUsagePerUser;
    if (validFrom) promoCode.validFrom = validFrom;
    if (validUntil) promoCode.validUntil = validUntil;
    if (applicableServices !== undefined)
      promoCode.applicableServices = applicableServices;
    if (applicableUsers !== undefined)
      promoCode.applicableUsers = applicableUsers;
    if (excludedUsers !== undefined) promoCode.excludedUsers = excludedUsers;
    if (isActive !== undefined) promoCode.isActive = isActive;

    await promoCode.save();

    res.json({
      success: true,
      message: "Promo code updated successfully",
      data: { promoCode },
    });
  } catch (error) {
    console.error("Error updating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update promo code",
    });
  }
};

/**
 * Delete promo code (Admin only)
 * @route DELETE /api/admin/promo-codes/:id
 * @access Private (Admin only)
 */
const deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // Check if promo code has been used
    if (promoCode.currentUsage > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete promo code that has been used",
      });
    }

    await PromoCode.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete promo code",
    });
  }
};

/**
 * Validate and apply promo code (User)
 * @route POST /api/promo-codes/validate
 * @access Private
 */
const validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount, serviceIds } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required",
      });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code",
      });
    }

    // Validate promo code for user
    const validation = promoCode.validateForUser(
      req.user._id,
      orderAmount * 100,
      serviceIds
    );
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Calculate discount
    const discountAmount = promoCode.calculateDiscount(orderAmount * 100);

    res.json({
      success: true,
      message: "Promo code applied successfully",
      data: {
        promoCode: {
          _id: promoCode._id,
          code: promoCode.code,
          name: promoCode.name,
          type: promoCode.type,
          value: promoCode.value,
        },
        discountAmount: discountAmount / 100, // Convert back to dollars
        finalAmount: (orderAmount * 100 - discountAmount) / 100, // Convert back to dollars
      },
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate promo code",
    });
  }
};

/**
 * Get promo code statistics (Admin only)
 * @route GET /api/admin/promo-codes/stats
 * @access Private (Admin only)
 */
const getPromoCodeStats = async (req, res) => {
  try {
    const totalPromoCodes = await PromoCode.countDocuments();
    const activePromoCodes = await PromoCode.countDocuments({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });
    const expiredPromoCodes = await PromoCode.countDocuments({
      validUntil: { $lt: new Date() },
    });

    // Get top used promo codes
    const topUsedPromoCodes = await PromoCode.find()
      .sort({ currentUsage: -1 })
      .limit(5)
      .select("code name currentUsage");

    // Get total discount given
    const totalDiscountResult = await PromoCode.aggregate([
      {
        $unwind: "$usageHistory",
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: "$usageHistory.discountAmount" },
        },
      },
    ]);

    const totalDiscount =
      totalDiscountResult.length > 0 ? totalDiscountResult[0].totalDiscount : 0;

    res.json({
      success: true,
      data: {
        totalPromoCodes,
        activePromoCodes,
        expiredPromoCodes,
        topUsedPromoCodes,
        totalDiscount: totalDiscount / 100, // Convert to dollars
      },
    });
  } catch (error) {
    console.error("Error fetching promo code stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promo code statistics",
    });
  }
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  getPromoCodeStats,
};
