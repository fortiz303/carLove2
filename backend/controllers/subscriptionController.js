const stripe = require("../config/stripe");
const Subscription = require("../models/Subscription");
const Booking = require("../models/Booking");
const User = require("../models/User");
// const { pricingHelpers } = require("../config/pricing");

// Simple pricing calculation for now
const calculateServicePrice = (serviceName, frequency) => {
  const basePrices = {
    "Interior Only": 30,
    "Exterior Only": 20,
    "Full Detail": 80,
  };

  const frequencyDiscounts = {
    "one-time": 1.0,
    weekly: 0.8, // 20% discount
    "bi-weekly": 0.85, // 15% discount
    monthly: 0.95, // 5% discount
  };

  const basePrice = basePrices[serviceName] || 30;
  const frequencyDiscount = frequencyDiscounts[frequency] || 1.0;

  return Math.round(basePrice * frequencyDiscount * 100) / 100;
};

// @desc    Create subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const {
      serviceId,
      frequency,
      scheduledDate,
      scheduledTime,
      vehicle,
      address,
      specialInstructions,
    } = req.body;

    // Validate required fields
    if (
      !serviceId ||
      !frequency ||
      !scheduledDate ||
      !scheduledTime ||
      !vehicle ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: serviceId, frequency, scheduledDate, scheduledTime, vehicle, address",
      });
    }

    // Validate frequency
    if (!["weekly", "bi-weekly", "monthly"].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid frequency. Must be weekly, bi-weekly, or monthly",
      });
    }

    // Get service details from database
    const Service = require("../models/Service");
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service not found",
      });
    }

    // Calculate price with frequency discount
    const basePrice = calculateServicePrice(service.name, frequency);
    const discountedPrice = calculateServicePrice(service.name, frequency);

    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.fullName,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;

      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customerId,
      });
    }

    // Create Stripe product first
    const product = await stripe.products.create({
      name: `${service.name} - ${frequency}`,
      description: `Recurring ${frequency} service`,
    });

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "usd",
            product: product.id,
            unit_amount: Math.round(discountedPrice * 100), // Convert to cents
            recurring: {
              interval: frequency === "weekly" ? "week" : "week",
              interval_count: frequency === "bi-weekly" ? 2 : 1,
            },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    // Create subscription in database
    const subscriptionDoc = new Subscription({
      user: req.user._id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      service: serviceId,
      frequency,
      startDate: new Date(scheduledDate),
      scheduledTime,
      vehicle,
      address,
      specialInstructions,
      pricePerService: discountedPrice,
      nextServiceDate: new Date(scheduledDate),
    });

    await subscriptionDoc.save();

    // Get the payment intent ID from the subscription's latest invoice
    const paymentIntentId = subscription.latest_invoice?.payment_intent?.id;

    // Create first booking
    const firstBooking = new Booking({
      user: req.user._id,
      services: [{ service: serviceId, quantity: 1, price: discountedPrice }],
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      vehicle,
      address,
      frequency,
      specialInstructions,
      totalAmount: discountedPrice,
      duration: 120,
      status: "confirmed",
      payment: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePaymentIntentId: paymentIntentId, // Store the payment intent ID for payment confirmation
        paymentStatus: "paid", // Subscription payments are considered paid when subscription is created
        paidAt: new Date(),
      },
    });

    await firstBooking.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription: subscriptionDoc,
        booking: firstBooking,
        stripeSubscription: subscription,
      },
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create subscription",
    });
  }
};

// @desc    Get user subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.getActiveByUser(req.user._id);

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscriptions",
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Cancel in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Cancel in database
    await subscription.cancel(reason);

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};

// @desc    Pause subscription
// @route   POST /api/subscriptions/:id/pause
// @access  Private
const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await subscription.pause();

    res.json({
      success: true,
      message: "Subscription paused successfully",
    });
  } catch (error) {
    console.error("Pause subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pause subscription",
    });
  }
};

// @desc    Resume subscription
// @route   POST /api/subscriptions/:id/resume
// @access  Private
const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await subscription.resume();

    res.json({
      success: true,
      message: "Subscription resumed successfully",
    });
  } catch (error) {
    console.error("Resume subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resume subscription",
    });
  }
};

// @desc    Process due services (cron job)
// @route   POST /api/subscriptions/process-due
// @access  Private (Admin only)
const processDueServices = async (req, res) => {
  try {
    const dueSubscriptions = await Subscription.getDueServices();

    const results = [];
    for (const subscription of dueSubscriptions) {
      try {
        const booking = await subscription.createNextBooking();
        results.push({
          subscriptionId: subscription._id,
          bookingId: booking._id,
          status: "created",
        });
      } catch (error) {
        console.error(
          `Failed to create booking for subscription ${subscription._id}:`,
          error
        );
        results.push({
          subscriptionId: subscription._id,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${dueSubscriptions.length} due services`,
      data: { results },
    });
  } catch (error) {
    console.error("Process due services error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process due services",
    });
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  processDueServices,
};
