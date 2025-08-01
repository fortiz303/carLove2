const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const {
  validateBooking,
  validateId,
  validatePagination,
  validateDateRange,
} = require("../middleware/validation");

// All routes require authentication
router.use(authenticateJWT);

// Public booking routes (for authenticated users)
router.post("/", validateBooking, bookingController.createBooking);
router.get("/", validatePagination, bookingController.getUserBookings);
router.get("/available-slots", bookingController.getAvailableSlots);
router.get("/:id", validateId, bookingController.getBooking);
router.put("/:id", validateId, bookingController.updateBooking);
router.post("/:id/cancel", validateId, bookingController.cancelBooking);
router.post("/:id/reschedule", validateId, bookingController.rescheduleBooking);
router.post("/:id/review", validateId, bookingController.addReview);

// Admin routes
router.get(
  "/admin/stats",
  authorize("admin"),
  validateDateRange,
  bookingController.getBookingStats
);

// Admin booking management routes
router.get(
  "/admin/all",
  authorize("admin"),
  validatePagination,
  bookingController.getAllBookings
);

router.get("/admin/test", authorize("admin"), bookingController.testBookings);

router.post(
  "/admin/:id/accept",
  authorize("admin"),
  validateId,
  bookingController.acceptBooking
);

router.post(
  "/admin/:id/reject",
  authorize("admin"),
  validateId,
  bookingController.rejectBooking
);

router.post(
  "/admin/:id/cancel",
  authorize("admin"),
  validateId,
  bookingController.adminCancelBooking
);

router.post(
  "/admin/:id/complete",
  authorize("admin"),
  validateId,
  bookingController.completeBooking
);

router.get(
  "/admin/:id/available-slots",
  authorize("admin"),
  validateId,
  bookingController.getRescheduleSlots
);

module.exports = router;
