const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]+$/, "Promo code can only contain letters and numbers"],
      minlength: [3, "Promo code must be at least 3 characters"],
      maxlength: [20, "Promo code cannot exceed 20 characters"],
    },
    name: {
      type: String,
      required: [true, "Promo code name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    // For percentage discounts, value should be between 0-100
    // For fixed discounts, value is the amount in cents
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maximumDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    // Usage limits
    maxUsage: {
      type: Number,
      default: null,
      min: [1, "Maximum usage must be at least 1"],
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
      min: [1, "Maximum usage per user must be at least 1"],
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: [0, "Current usage cannot be negative"],
    },
    // Date restrictions
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
    },
    // Service restrictions
    applicableServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    // User restrictions
    applicableUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Exclude specific users
    excludedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Usage tracking
    usageHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        booking: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
          required: true,
        },
        discountAmount: {
          type: Number,
          required: true,
        },
        orderAmount: {
          type: Number,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Created by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ "usageHistory.user": 1 });

// Virtual for checking if promo code is expired
promoCodeSchema.virtual("isExpired").get(function () {
  return new Date() > this.validUntil;
});

// Virtual for checking if promo code is active
promoCodeSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (!this.maxUsage || this.currentUsage < this.maxUsage)
  );
});

// Method to validate promo code for a user and order
promoCodeSchema.methods.validateForUser = function (
  userId,
  orderAmount,
  serviceIds = []
) {
  const now = new Date();

  // Check if promo code is active and not expired
  if (!this.isActive || now < this.validFrom || now > this.validUntil) {
    return { valid: false, message: "Promo code is not active or has expired" };
  }

  // Check usage limits
  if (this.maxUsage && this.currentUsage >= this.maxUsage) {
    return { valid: false, message: "Promo code usage limit reached" };
  }

  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of $${(
        this.minimumOrderAmount / 100
      ).toFixed(2)} required`,
    };
  }

  // Check service restrictions
  if (this.applicableServices.length > 0) {
    const hasApplicableService = serviceIds.some((serviceId) =>
      this.applicableServices.some(
        (appService) => appService.toString() === serviceId.toString()
      )
    );
    if (!hasApplicableService) {
      return {
        valid: false,
        message: "Promo code not applicable to selected services",
      };
    }
  }

  // Check user restrictions
  if (
    this.excludedUsers.some((user) => user.toString() === userId.toString())
  ) {
    return { valid: false, message: "Promo code not available for this user" };
  }

  if (this.applicableUsers.length > 0) {
    const isApplicableUser = this.applicableUsers.some(
      (user) => user.toString() === userId.toString()
    );
    if (!isApplicableUser) {
      return {
        valid: false,
        message: "Promo code not available for this user",
      };
    }
  }

  // Check per-user usage limit
  const userUsageCount = this.usageHistory.filter(
    (usage) => usage.user.toString() === userId.toString()
  ).length;

  if (userUsageCount >= this.maxUsagePerUser) {
    return {
      valid: false,
      message: "You have already used this promo code maximum times",
    };
  }

  return { valid: true };
};

// Method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function (orderAmount) {
  let discountAmount = 0;

  if (this.type === "percentage") {
    discountAmount = (orderAmount * this.value) / 100;
  } else {
    discountAmount = this.value;
  }

  // Apply maximum discount limit
  if (
    this.maximumDiscountAmount &&
    discountAmount > this.maximumDiscountAmount
  ) {
    discountAmount = this.maximumDiscountAmount;
  }

  // Ensure discount doesn't exceed order amount
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  return Math.round(discountAmount);
};

// Method to apply promo code
promoCodeSchema.methods.apply = function (
  userId,
  bookingId,
  orderAmount,
  discountAmount
) {
  this.currentUsage += 1;
  this.usageHistory.push({
    user: userId,
    booking: bookingId,
    discountAmount: discountAmount,
    orderAmount: orderAmount,
  });

  return this.save();
};

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);

module.exports = PromoCode;
