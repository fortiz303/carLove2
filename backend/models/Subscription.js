const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Subscription details
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "paused", "past_due"],
      default: "active",
    },
    // Service details
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    frequency: {
      type: String,
      enum: ["weekly", "bi-weekly", "monthly"],
      required: true,
    },
    // Scheduling details
    startDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    // Location and vehicle
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "US" },
      instructions: String,
    },
    vehicle: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      color: { type: String, required: true },
      type: {
        type: String,
        enum: ["sedan", "suv", "truck", "luxury", "other"],
        required: true,
      },
      licensePlate: String,
      vin: String,
    },
    // Pricing
    pricePerService: {
      type: Number,
      required: true,
    },
    totalServices: {
      type: Number,
      default: 12, // Default to 12 services
    },
    completedServices: {
      type: Number,
      default: 0,
    },
    // Next service tracking
    nextServiceDate: {
      type: Date,
      required: true,
    },
    // Cancellation
    cancelledAt: Date,
    cancellationReason: String,
    // Special instructions
    specialInstructions: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ nextServiceDate: 1 });

// Methods
subscriptionSchema.methods.getNextServiceDate = function () {
  const lastServiceDate = this.nextServiceDate || this.startDate;
  const nextDate = new Date(lastServiceDate);

  if (this.frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (this.frequency === "bi-weekly") {
    nextDate.setDate(nextDate.getDate() + 14);
  } else if (this.frequency === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
};

subscriptionSchema.methods.createNextBooking = async function () {
  const nextDate = this.getNextServiceDate();

  // Create new booking
  const Booking = require("./Booking");
  const booking = new Booking({
    user: this.user,
    services: [{ service: this.service, quantity: 1 }],
    scheduledDate: nextDate,
    scheduledTime: this.scheduledTime,
    vehicle: this.vehicle,
    address: this.address,
    frequency: this.frequency,
    specialInstructions: this.specialInstructions,
    status: "pending",
    totalAmount: this.pricePerService,
    duration: 120, // Default duration
  });

  await booking.save();

  // Update subscription
  this.nextServiceDate = nextDate;
  this.completedServices += 1;
  await this.save();

  return booking;
};

subscriptionSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

subscriptionSchema.methods.pause = function () {
  this.status = "paused";
  return this.save();
};

subscriptionSchema.methods.resume = function () {
  this.status = "active";
  return this.save();
};

// Static methods
subscriptionSchema.statics.getActiveByUser = function (userId) {
  return this.find({ user: userId, status: "active" }).populate("service");
};

subscriptionSchema.statics.getDueServices = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    status: "active",
    nextServiceDate: { $lte: today },
  }).populate("user service");
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
