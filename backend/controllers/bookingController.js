const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const User = require("../models/User");
const PromoCode = require("../models/PromoCode");
const { pricingHelpers } = require("../config/pricing");
const {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendAdminCancellationWithReschedule,
  sendBookingRescheduled,
} = require("../utils/emailService");

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      services,
      scheduledDate,
      scheduledTime,
      vehicle,
      address,
      frequency,
      specialInstructions,
      saveVehicle = false,
      promoCode,
    } = req.body;

    // Validate services and calculate total using pricing config
    let totalAmount = 0;
    let totalDuration = 0;
    const validatedServices = [];

    for (const serviceItem of services) {
      let serviceName = serviceItem.service;
      let service;

      // Try to find service by ID first, then by name
      if (mongoose.Types.ObjectId.isValid(serviceItem.service)) {
        service = await Service.findById(serviceItem.service);
        if (service) {
          serviceName = service.name;
        }
      }

      if (!service) {
        // Try to find by name
        service = await Service.findOne({
          name: serviceItem.service,
          isActive: true,
        });
        serviceName = serviceItem.service;
      }

      if (!service || !service.isActive) {
        return res.status(400).json({
          success: false,
          message: `Service ${serviceItem.service} not found or inactive`,
        });
      }

      const quantity = serviceItem.quantity || 1;
      const vehicleType = vehicle?.type || "sedan";
      const price = pricingHelpers.calculateSeasonalPrice(
        serviceName,
        vehicleType
      );

      validatedServices.push({
        service: service._id,
        quantity,
        price,
      });

      totalAmount += price * quantity;
      totalDuration += service.duration * quantity;
    }

    // Handle promo code if provided
    let discountAmount = 0;
    let appliedPromoCode = null;

    if (promoCode) {
      const promoCodeDoc = await PromoCode.findOne({
        code: promoCode.toUpperCase(),
      });
      if (promoCodeDoc) {
        // Get service IDs for validation
        const serviceIds = validatedServices.map((s) => s.service);

        // Validate promo code
        const validation = promoCodeDoc.validateForUser(
          req.user.id,
          totalAmount,
          serviceIds
        );
        if (validation.valid) {
          // Calculate discount
          discountAmount = promoCodeDoc.calculateDiscount(totalAmount);
          appliedPromoCode = promoCodeDoc._id;

          // Apply discount to total
          totalAmount -= discountAmount;

          // Ensure total doesn't go below 0
          if (totalAmount < 0) totalAmount = 0;
        }
      }
    }

    // Save vehicle to user's vehicles if requested
    if (saveVehicle && vehicle) {
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          // Check if vehicle already exists (by make, model, year, and license plate if provided)
          const existingVehicle = user.vehicles.find(
            (v) =>
              v.make.toLowerCase() === vehicle.make.toLowerCase() &&
              v.model.toLowerCase() === vehicle.model.toLowerCase() &&
              v.year === vehicle.year &&
              (!vehicle.licensePlate || v.licensePlate === vehicle.licensePlate)
          );

          if (!existingVehicle) {
            await user.addVehicle({
              ...vehicle,
              isDefault: user.vehicles.length === 0, // Make default if it's the first vehicle
            });
          }
        }
      } catch (vehicleError) {
        console.error("Error saving vehicle to user:", vehicleError);
        // Don't fail the booking creation if vehicle saving fails
      }
    }

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      services: validatedServices,
      totalAmount,
      scheduledDate,
      scheduledTime,
      duration: totalDuration,
      vehicle,
      address,
      frequency,
      specialInstructions,
      promoCode: appliedPromoCode,
      discountAmount,
    });

    await booking.save();

    // Apply promo code usage if discount was applied
    if (appliedPromoCode && discountAmount > 0) {
      try {
        const promoCodeDoc = await PromoCode.findById(appliedPromoCode);
        if (promoCodeDoc) {
          await promoCodeDoc.apply(
            req.user.id,
            booking._id,
            totalAmount + discountAmount,
            discountAmount
          );
        }
      } catch (promoError) {
        console.error("Error applying promo code usage:", promoError);
        // Don't fail the booking creation if promo code tracking fails
      }
    }

    // Populate for email
    await booking.populate("services.service user");

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("services.service", "name category basePrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("services.service", "name category basePrice duration")
      .populate("assignedStaff", "fullName phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only allow updates if booking is not completed or cancelled
    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update completed or cancelled booking",
      });
    }

    const {
      scheduledDate,
      scheduledTime,
      vehicle,
      address,
      specialInstructions,
    } = req.body;

    // Update fields
    if (scheduledDate) booking.scheduledDate = scheduledDate;
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    if (vehicle) booking.vehicle = { ...booking.vehicle, ...vehicle };
    if (address) booking.address = { ...booking.address, ...address };
    if (specialInstructions) booking.specialInstructions = specialInstructions;

    await booking.save();

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Cancel booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    // Validate reason is provided
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking can be cancelled
    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled",
      });
    }

    await booking.cancel(req.user.id, reason);

    // Handle payment refund if payment was already processed
    if (
      booking.payment.paymentStatus === "paid" &&
      booking.payment.stripePaymentIntentId
    ) {
      try {
        const stripe = require("../config/stripe");

        // Get payment intent to find the charge
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.payment.stripePaymentIntentId
        );

        if (paymentIntent.latest_charge) {
          // Process refund
          const refund = await stripe.refunds.create({
            charge: paymentIntent.latest_charge,
            reason: "requested_by_customer",
            metadata: {
              bookingId: booking._id.toString(),
              refundedBy: req.user.id,
              cancellationReason: reason,
            },
          });

          // Update booking payment status
          booking.payment.paymentStatus = "refunded";
          booking.payment.refundedAt = new Date();
          await booking.save();
        }
      } catch (refundError) {
        console.error("Failed to process refund:", refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Populate for email
    await booking.populate("services.service user");

    // Send cancellation email
    try {
      await sendBookingCancellation(booking);
    } catch (emailError) {
      console.error("Failed to send booking cancellation email:", emailError);
    }

    const message =
      booking.payment.paymentStatus === "refunded"
        ? "Booking cancelled successfully. Payment has been refunded."
        : "Booking cancelled successfully.";

    res.json({
      success: true,
      message,
      data: { booking },
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add review to booking
// @route   POST /api/bookings/:id/review
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      });
    }

    // Check if already reviewed
    if (booking.rating) {
      return res.status(400).json({
        success: false,
        message: "Booking already reviewed",
      });
    }

    await booking.addReview(rating, review);

    res.json({
      success: true,
      message: "Review added successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get available time slots
// @route   GET /api/bookings/available-slots
// @access  Private
const getAvailableSlots = async (req, res) => {
  try {
    const { date, duration = 120 } = req.query; // duration in minutes

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Business hours: 8 AM to 6 PM, Monday to Saturday
    const businessHours = {
      start: 8, // 8 AM
      end: 18, // 6 PM
      days: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    };

    // Check if date is within business days
    if (!businessHours.days.includes(dayOfWeek)) {
      return res.json({
        success: true,
        data: { availableSlots: [] },
      });
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      scheduledDate: selectedDate,
      status: { $nin: ["cancelled"] },
    });

    // Generate time slots
    const slots = [];
    const slotInterval = 30; // 30-minute intervals

    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotTime = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        // Check if slot is available
        const isAvailable = !existingBookings.some((booking) => {
          const bookingStart = booking.scheduledTime;
          const bookingEnd = booking.endTime;
          const slotEnd = new Date(selectedDate);
          slotEnd.setHours(hour, minute + duration, 0, 0);
          const slotEndTime = slotEnd.toTimeString().slice(0, 5);

          return (
            (slotTime >= bookingStart && slotTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        if (isAvailable) {
          slots.push(slotTime);
        }
      }
    }

    res.json({
      success: true,
      data: { availableSlots: slots },
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get booking statistics (Admin)
// @route   GET /api/bookings/stats
// @access  Private/Admin
const getBookingStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get booking counts by status
    const statusStats = await Booking.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get total revenue
    const revenueStats = await Booking.aggregate([
      { $match: { ...dateFilter, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Get bookings by service category
    const serviceStats = await Booking.aggregate([
      { $match: dateFilter },
      { $unwind: "$services" },
      {
        $lookup: {
          from: "services",
          localField: "services.service",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      { $unwind: "$serviceInfo" },
      { $group: { _id: "$serviceInfo.category", count: { $sum: 1 } } },
    ]);

    const stats = {
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      totalRevenue: revenueStats[0]?.total || 0,
      byServiceCategory: serviceStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get booking stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/admin/all
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Search functionality - we'll handle this after population
    let searchQuery = query;
    let searchFilter = null;

    if (search) {
      // First, find users that match the search criteria
      const User = require("../models/User");
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchingUsers.map((user) => user._id);

      // Add user filter to the query
      if (userIds.length > 0) {
        searchFilter = { user: { $in: userIds } };
      } else {
        // If no users match, also search vehicle fields
        searchFilter = {
          $or: [
            { "vehicle.make": { $regex: search, $options: "i" } },
            { "vehicle.model": { $regex: search, $options: "i" } },
          ],
        };
      }
    }

    // Combine the status filter with search filter
    if (searchFilter) {
      query = { ...query, ...searchFilter };
    }

    const bookings = await Booking.find(query)
      .populate("user", "fullName email phone")
      .populate("services.service", "name category basePrice duration")
      .populate("assignedStaff", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Accept booking (Admin)
// @route   POST /api/bookings/admin/:id/accept
// @access  Private/Admin
const acceptBooking = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { assignedStaff, notes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be accepted",
      });
    }

    // Update booking status
    booking.status = "confirmed";
    if (assignedStaff) {
      booking.assignedStaff = assignedStaff;
    }

    // Add admin note if provided
    if (notes) {
      await booking.addNote(req.user.id, `Booking accepted by admin: ${notes}`);
    }

    await booking.save();

    // Populate for email
    await booking.populate("services.service user assignedStaff");

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    res.json({
      success: true,
      message: "Booking accepted successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reject booking (Admin)
// @route   POST /api/bookings/admin/:id/reject
// @access  Private/Admin
const rejectBooking = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { reason, refundAmount } = req.body;

    // Validate reason is provided
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be rejected",
      });
    }

    // Cancel the booking
    await booking.cancel(req.user.id, `Rejected by admin: ${reason}`);

    // Process refund if payment was made
    if (booking.payment.paymentStatus === "paid" && refundAmount) {
      try {
        // This would integrate with your payment processor (Stripe, etc.)
        // For now, we'll just update the payment status
        booking.payment.paymentStatus = "refunded";
        booking.payment.refundedAt = new Date();
        await booking.save();
      } catch (refundError) {
        console.error("Failed to process refund:", refundError);
      }
    }

    // Populate for email
    await booking.populate("services.service user");

    // Send cancellation email
    try {
      await sendBookingCancellation(booking);
    } catch (emailError) {
      console.error("Failed to send booking cancellation email:", emailError);
    }

    res.json({
      success: true,
      message: "Booking rejected successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Admin cancel booking
// @route   POST /api/bookings/admin/:id/cancel
// @access  Private/Admin
const adminCancelBooking = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { reason, refundAmount, offerReschedule } = req.body;

    // Validate reason is provided
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled",
      });
    }

    // Cancel the booking
    await booking.cancel(req.user.id, `Cancelled by admin: ${reason}`);

    // Process refund if payment was made
    if (booking.payment.paymentStatus === "paid" && refundAmount) {
      try {
        // This would integrate with your payment processor (Stripe, etc.)
        booking.payment.paymentStatus = "refunded";
        booking.payment.refundedAt = new Date();
        await booking.save();
      } catch (refundError) {
        console.error("Failed to process refund:", refundError);
      }
    }

    // Add reschedule offer flag
    if (offerReschedule) {
      booking.rescheduleOffered = true;
      booking.rescheduleOfferedAt = new Date();
      await booking.save();
    }

    // Populate for email
    await booking.populate("services.service user");

    // Send cancellation email
    try {
      await sendAdminCancellationWithReschedule(booking);
    } catch (emailError) {
      console.error("Failed to send booking cancellation email:", emailError);
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Admin cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get available time slots for rescheduling
// @route   GET /api/bookings/admin/:id/available-slots
// @access  Private/Admin
const getRescheduleSlots = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { date, duration } = req.query;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get available slots for the specified date
    const availableSlots = await getAvailableSlotsForDate(
      date || new Date().toISOString().split("T")[0],
      duration || booking.duration
    );

    res.json({
      success: true,
      data: { availableSlots },
    });
  } catch (error) {
    console.error("Get reschedule slots error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reschedule booking (User accepts admin reschedule offer)
// @route   POST /api/bookings/:id/reschedule
// @access  Private
const rescheduleBooking = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "New date and time are required",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking can be rescheduled
    if (!booking.rescheduleOffered && booking.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be rescheduled",
      });
    }

    // Validate the new time slot is available
    const conflictingBooking = await Booking.findOne({
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime,
      status: { $in: ["confirmed", "pending"] },
      _id: { $ne: booking._id }, // Exclude current booking
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
    }

    // Reschedule the booking
    await booking.reschedule(new Date(scheduledDate), scheduledTime);

    // Add note about rescheduling
    await booking.addNote(req.user.id, "Booking rescheduled by user");

    // Populate for email
    await booking.populate("services.service user");

    // Send confirmation email
    try {
      await sendBookingRescheduled(booking);
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    res.json({
      success: true,
      message: "Booking rescheduled successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Complete booking (admin only)
// @route   POST /api/bookings/admin/:id/complete
// @access  Private/Admin
const completeBooking = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { completionNotes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking can be completed
    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be completed",
      });
    }

    await booking.complete(completionNotes);

    // Populate for email
    await booking.populate("services.service user");

    // Send completion email
    try {
      await sendBookingCompletion(booking);
    } catch (emailError) {
      console.error("Failed to send booking completion email:", emailError);
    }

    res.json({
      success: true,
      message: "Booking marked as completed successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Test endpoint to check bookings count
// @route   GET /api/bookings/admin/test
// @access  Private/Admin
const testBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const totalBookings = await Booking.countDocuments({});
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        userRole: req.user.role,
        userId: req.user.id,
      },
    });
  } catch (error) {
    console.error("Test bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to get available slots for a specific date
const getAvailableSlotsForDate = async (date, duration) => {
  const businessHours = {
    start: 8, // 8 AM
    end: 18, // 6 PM
  };

  const slotDuration = 60; // 1 hour slots
  const slots = [];

  // Generate time slots
  for (let hour = businessHours.start; hour < businessHours.end; hour++) {
    const timeSlot = `${hour.toString().padStart(2, "0")}:00`;

    // Check if this slot conflicts with existing bookings
    const conflictingBooking = await Booking.findOne({
      scheduledDate: new Date(date),
      scheduledTime: timeSlot,
      status: { $in: ["confirmed", "pending"] },
    });

    if (!conflictingBooking) {
      slots.push({
        time: timeSlot,
        available: true,
      });
    } else {
      slots.push({
        time: timeSlot,
        available: false,
        reason: "Booked",
      });
    }
  }

  return slots;
};

module.exports = {
  createBooking,
  getUserBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  addReview,
  getAvailableSlots,
  getBookingStats,
  getAllBookings,
  acceptBooking,
  rejectBooking,
  adminCancelBooking,
  completeBooking,
  getRescheduleSlots,
  rescheduleBooking,
  testBookings,
};
