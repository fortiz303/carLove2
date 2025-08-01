const stripe = require("../config/stripe");
const Booking = require("../models/Booking");
const User = require("../models/User");

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate(
      "user",
      "email fullName stripeCustomerId"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking is already paid
    if (booking.payment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    // Create or get Stripe customer
    let customerId = booking.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: booking.user.email,
        name: booking.user.fullName,
        metadata: {
          userId: booking.user._id.toString(),
        },
      });

      customerId = customer.id;

      // Save customer ID to user
      await User.findByIdAndUpdate(booking.user._id, {
        stripeCustomerId: customerId,
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        bookingId: booking._id.toString(),
        userId: booking.user._id.toString(),
      },
      description: `Car detailing booking #${booking._id.toString().slice(-6)}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    booking.payment.stripePaymentIntentId = paymentIntent.id;
    booking.payment.stripeCustomerId = customerId;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      const booking = await Booking.findOne({
        "payment.stripePaymentIntentId": paymentIntentId,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Update booking payment status
      booking.payment.paymentStatus = "paid";
      booking.payment.paidAt = new Date();
      booking.status = "confirmed";
      await booking.save();

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        data: { booking },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    const booking = await Booking.findOne({
      "payment.stripePaymentIntentId": paymentIntent.id,
    });

    if (!booking) {
      console.error("Booking not found for payment intent:", paymentIntent.id);
      return;
    }

    // Update booking
    booking.payment.paymentStatus = "paid";
    booking.payment.paidAt = new Date();
    booking.status = "confirmed";
    await booking.save();

    console.log(`Payment succeeded for booking ${booking._id}`);
  } catch (error) {
    console.error("Handle payment succeeded error:", error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const booking = await Booking.findOne({
      "payment.stripePaymentIntentId": paymentIntent.id,
    });

    if (!booking) {
      console.error("Booking not found for payment intent:", paymentIntent.id);
      return;
    }

    // Update booking
    booking.payment.paymentStatus = "failed";
    await booking.save();

    console.log(`Payment failed for booking ${booking._id}`);
  } catch (error) {
    console.error("Handle payment failed error:", error);
  }
};

// Handle refund
const handleRefund = async (charge) => {
  try {
    const booking = await Booking.findOne({
      "payment.stripePaymentIntentId": charge.payment_intent,
    });

    if (!booking) {
      console.error("Booking not found for charge:", charge.id);
      return;
    }

    // Update booking
    booking.payment.paymentStatus = "refunded";
    booking.payment.refundedAt = new Date();
    booking.status = "cancelled";
    await booking.save();

    console.log(`Refund processed for booking ${booking._id}`);
  } catch (error) {
    console.error("Handle refund error:", error);
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
const getPaymentMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        data: { paymentMethods: [] },
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    res.json({
      success: true,
      data: { paymentMethods: paymentMethods.data },
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
const addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: "No Stripe customer found",
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    res.json({
      success: true,
      message: "Payment method added successfully",
    });
  } catch (error) {
    console.error("Add payment method error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Remove payment method
// @route   DELETE /api/payments/methods/:paymentMethodId
// @access  Private
const removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: "Payment method removed successfully",
    });
  } catch (error) {
    console.error("Remove payment method error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { bookingId, amount, reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!booking.payment.stripePaymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "No payment found for this booking",
      });
    }

    // Get payment intent to find the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.payment.stripePaymentIntentId
    );

    if (!paymentIntent.latest_charge) {
      return res.status(400).json({
        success: false,
        message: "No charge found for this payment",
      });
    }

    // Process refund
    const refundAmount = amount ? Math.round(amount * 100) : undefined; // Convert to cents
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
      metadata: {
        bookingId: booking._id.toString(),
        refundedBy: req.user.id,
      },
    });

    // Update booking
    booking.payment.paymentStatus = "refunded";
    booking.payment.refundedAt = new Date();
    booking.status = "cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: { refund },
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  processRefund,
};
