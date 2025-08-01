const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "booking",
        "payment",
        "service",
        "technical",
        "general",
        "complaint",
        "suggestion",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    // Assigned staff member
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Messages/Responses
    messages: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        isInternal: {
          type: Boolean,
          default: false, // Internal notes not visible to customer
        },
        attachments: [
          {
            filename: String,
            originalName: String,
            mimeType: String,
            size: Number,
            url: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Resolution
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: Date,
    resolution: String,
    // Customer satisfaction
    satisfaction: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    // Tags for categorization
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // SLA tracking
    sla: {
      targetResolutionHours: {
        type: Number,
        default: 24,
      },
      firstResponseAt: Date,
      resolvedAt: Date,
      isOverdue: {
        type: Boolean,
        default: false,
      },
    },
    // Escalation
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    escalatedAt: Date,
    escalationReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Virtual for ticket age in hours
supportTicketSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Virtual for SLA status
supportTicketSchema.virtual("slaStatus").get(function () {
  if (this.status === "resolved" || this.status === "closed") {
    return "resolved";
  }

  const ageInHours = this.ageInHours;
  const targetHours = this.sla.targetResolutionHours;

  if (ageInHours > targetHours) {
    return "overdue";
  } else if (ageInHours > targetHours * 0.8) {
    return "warning";
  } else {
    return "on-track";
  }
});

// Pre-save middleware to update SLA overdue status
supportTicketSchema.pre("save", function (next) {
  if (this.status !== "resolved" && this.status !== "closed") {
    this.sla.isOverdue = this.ageInHours > this.sla.targetResolutionHours;
  }
  next();
});

// Method to add message
supportTicketSchema.methods.addMessage = function (
  authorId,
  content,
  isInternal = false,
  attachments = []
) {
  this.messages.push({
    author: authorId,
    content,
    isInternal,
    attachments,
  });

  // Update status to in-progress if it was open and message is from staff
  if (this.status === "open" && !isInternal) {
    this.status = "in-progress";
  }

  // Set first response time if this is the first staff response
  if (!this.sla.firstResponseAt && !isInternal) {
    this.sla.firstResponseAt = new Date();
  }

  return this.save();
};

// Method to resolve ticket
supportTicketSchema.methods.resolve = function (resolvedBy, resolution) {
  this.status = "resolved";
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  this.resolution = resolution;
  this.sla.resolvedAt = new Date();
  return this.save();
};

// Method to close ticket
supportTicketSchema.methods.close = function () {
  this.status = "closed";
  return this.save();
};

// Method to escalate ticket
supportTicketSchema.methods.escalate = function (escalatedTo, reason) {
  this.escalatedTo = escalatedTo;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  this.priority = "high"; // Auto-upgrade priority on escalation
  return this.save();
};

// Method to add satisfaction rating
supportTicketSchema.methods.addSatisfaction = function (rating, feedback) {
  this.satisfaction = rating;
  this.feedback = feedback;
  return this.save();
};

// Static method to get tickets by status
supportTicketSchema.statics.getByStatus = function (status, limit = 50) {
  return this.find({ status })
    .populate("user", "fullName email")
    .populate("booking", "scheduledDate vehicle")
    .populate("assignedTo", "fullName")
    .populate("messages.author", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get overdue tickets
supportTicketSchema.statics.getOverdue = function () {
  return this.find({
    status: { $nin: ["resolved", "closed"] },
    "sla.isOverdue": true,
  })
    .populate("user", "fullName email")
    .populate("assignedTo", "fullName")
    .sort({ createdAt: 1 });
};

// Static method to get tickets by user
supportTicketSchema.statics.getByUser = function (userId, limit = 20) {
  return this.find({ user: userId })
    .populate("booking", "scheduledDate vehicle")
    .populate("assignedTo", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
