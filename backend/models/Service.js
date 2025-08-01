const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
    },
    category: {
      type: String,
      enum: ["interior", "exterior", "full", "addon"],
      required: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: Number, // in minutes
      required: [true, "Service duration is required"],
      min: [15, "Minimum duration is 15 minutes"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: String,
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    // For add-ons that can be combined with other services
    canCombineWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    // Special pricing for different vehicle types
    vehicleTypePricing: {
      sedan: {
        type: Number,
        default: 0, // Additional cost for sedan
      },
      suv: {
        type: Number,
        default: 0, // Additional cost for SUV
      },
      truck: {
        type: Number,
        default: 0, // Additional cost for truck
      },
      luxury: {
        type: Number,
        default: 0, // Additional cost for luxury vehicles
      },
    },
    // Seasonal pricing
    seasonalPricing: [
      {
        season: {
          type: String,
          enum: ["spring", "summer", "fall", "winter"],
        },
        multiplier: {
          type: Number,
          default: 1.0,
        },
        startDate: Date,
        endDate: Date,
      },
    ],
    // Popularity tracking
    popularity: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 1 });

// Method to calculate price for specific vehicle type
serviceSchema.methods.calculatePrice = function (vehicleType = "sedan") {
  const basePrice = this.basePrice;
  const vehicleSurcharge = this.vehicleTypePricing[vehicleType] || 0;
  return basePrice + vehicleSurcharge;
};

// Method to get current seasonal price
serviceSchema.methods.getSeasonalPrice = function (vehicleType = "sedan") {
  const basePrice = this.calculatePrice(vehicleType);
  const now = new Date();

  const currentSeason = this.seasonalPricing.find((season) => {
    return now >= season.startDate && now <= season.endDate;
  });

  if (currentSeason) {
    return basePrice * currentSeason.multiplier;
  }

  return basePrice;
};

// Static method to get active services by category
serviceSchema.statics.getActiveByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ popularity: -1 });
};

// Static method to get popular services
serviceSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isActive: true }).sort({ popularity: -1 }).limit(limit);
};

module.exports = mongoose.model("Service", serviceSchema);
