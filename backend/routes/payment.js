const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const { validatePayment, validateId } = require("../middleware/validation");

// Webhook route (no authentication required)
router.post("/webhook", paymentController.handleWebhook);

// All other routes require authentication
router.use(authenticateJWT);

// Payment routes
router.post("/create-intent", paymentController.createPaymentIntent);
router.post("/confirm", paymentController.confirmPayment);

// Payment methods
router.get("/methods", paymentController.getPaymentMethods);
router.post("/methods", paymentController.addPaymentMethod);
router.delete(
  "/methods/:paymentMethodId",
  paymentController.removePaymentMethod
);

// Admin routes
router.post("/refund", authorize("admin"), paymentController.processRefund);

module.exports = router;
