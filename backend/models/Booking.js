const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    scheduledDate: {
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
    duration: {
      type: Number, // in minutes
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "pending",
    },
    // Vehicle information
    vehicle: {
      make: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1,
      },
      color: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["sedan", "suv", "truck", "luxury", "other"],
        required: true,
      },
      licensePlate: String,
      vin: String,
    },
    // Service location
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "US",
      },
      instructions: String,
    },
    // Frequency for recurring bookings
    frequency: {
      type: String,
      enum: ["one-time", "weekly", "bi-weekly", "monthly"],
      default: "one-time",
    },
    // Payment information
    payment: {
      stripePaymentIntentId: String,
      stripeCustomerId: String,
      stripeSubscriptionId: String, // For subscription-related bookings
      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
      refundedAt: Date,
    },
    // Special instructions
    specialInstructions: String,
    // Promo code information
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Staff assignment
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin/staff users
    },
    // Booking notes
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Cancellation
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: Date,
    cancellationReason: String,

    // Reschedule tracking
    rescheduleOffered: {
      type: Boolean,
      default: false,
    },
    rescheduleOfferedAt: Date,
    rescheduleAccepted: {
      type: Boolean,
      default: false,
    },
    rescheduleAcceptedAt: Date,
    originalScheduledDate: Date,
    originalScheduledTime: String,

    // Completion
    completedAt: Date,
    completionNotes: String,
    // Rating and review
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
    reviewedAt: Date,
    // Reminders
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "sms", "push"],
        },
        sentAt: Date,
        status: {
          type: String,
          enum: ["pending", "sent", "failed"],
          default: "pending",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });
bookingSchema.index({ "payment.stripePaymentIntentId": 1 });
bookingSchema.index({ "payment.stripeSubscriptionId": 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for booking end time
bookingSchema.virtual("endTime").get(function () {
  if (!this.scheduledTime || !this.duration) return null;

  const [hours, minutes] = this.scheduledTime.split(":").map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime.getTime() + this.duration * 60000);
  return endTime.toTimeString().slice(0, 5);
});

// Virtual for isOverdue
bookingSchema.virtual("isOverdue").get(function () {
  if (this.status !== "confirmed" && this.status !== "in-progress")
    return false;

  const now = new Date();
  const scheduledDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.scheduledTime.split(":").map(Number);
  scheduledDateTime.setHours(hours, minutes, 0, 0);

  const endDateTime = new Date(
    scheduledDateTime.getTime() + this.duration * 60000
  );
  return now > endDateTime;
});

// Pre-save middleware to calculate total amount
bookingSchema.pre("save", function (next) {
  if (this.isModified("services")) {
    this.totalAmount = this.services.reduce((total, service) => {
      return total + service.price * service.quantity;
    }, 0);
  }
  next();
});

// Method to add note
bookingSchema.methods.addNote = function (authorId, content) {
  this.notes.push({
    author: authorId,
    content,
  });
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = function (userId, reason) {
  this.status = "cancelled";
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to reschedule booking
bookingSchema.methods.reschedule = function (newDate, newTime) {
  // Store original date/time if not already stored
  if (!this.originalScheduledDate) {
    this.originalScheduledDate = this.scheduledDate;
    this.originalScheduledTime = this.scheduledTime;
  }

  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.status = "pending"; // Set to pending so admin can review
  this.rescheduleAccepted = true;
  this.rescheduleAcceptedAt = new Date();
  this.rescheduleOffered = false; // Reset the offer flag

  return this.save();
};

// Method to complete booking
bookingSchema.methods.complete = function (notes) {
  this.status = "completed";
  this.completedAt = new Date();
  this.completionNotes = notes;
  return this.save();
};

// Method to add review
bookingSchema.methods.addReview = function (rating, review) {
  this.rating = rating;
  this.review = review;
  this.reviewedAt = new Date();
  return this.save();
};

// Static method to get upcoming bookings
bookingSchema.statics.getUpcoming = function (userId, limit = 10) {
  return this.find({
    user: userId,
    status: { $in: ["confirmed", "pending"] },
    scheduledDate: { $gte: new Date() },
  })
    .populate("services.service")
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .limit(limit);
};

// Static method to get bookings by status
bookingSchema.statics.getByStatus = function (status, limit = 50) {
  return this.find({ status })
    .populate("user", "fullName email phone")
    .populate("services.service", "name category")
    .populate("assignedStaff", "fullName")
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .limit(limit);
};

module.exports = mongoose.model("Booking", bookingSchema);
