const express = require("express");
const router = express.Router();
const {
  createSubscription,
  getUserSubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  processDueServices,
} = require("../controllers/subscriptionController");
const { protect } = require("../middleware/auth");
const { validateId } = require("../middleware/validation");

// @route   POST /api/subscriptions
// @desc    Create new subscription
// @access  Private
router.post("/", protect, createSubscription);

// @route   GET /api/subscriptions
// @desc    Get user subscriptions
// @access  Private
router.get("/", protect, getUserSubscriptions);

// @route   POST /api/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private
router.post("/:id/cancel", protect, validateId, cancelSubscription);

// @route   POST /api/subscriptions/:id/pause
// @desc    Pause subscription
// @access  Private
router.post("/:id/pause", protect, validateId, pauseSubscription);

// @route   POST /api/subscriptions/:id/resume
// @desc    Resume subscription
// @access  Private
router.post("/:id/resume", protect, validateId, resumeSubscription);

// @route   POST /api/subscriptions/process-due
// @desc    Process due services (cron job)
// @access  Private (Admin only)
router.post("/process-due", protect, processDueServices);

module.exports = router;
