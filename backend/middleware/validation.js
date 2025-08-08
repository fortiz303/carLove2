const { body, param, query, validationResult } = require("express-validator");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  handleValidationErrors,
];

// User login validation
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Profile update validation
const validateProfileUpdate = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer-not-to-say"])
    .withMessage("Invalid gender selection"),
  handleValidationErrors,
];

// Address validation
const validateAddress = [
  body("label")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Address label must be between 1 and 50 characters"),
  body("street").trim().notEmpty().withMessage("Street address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("zipCode").trim().notEmpty().withMessage("ZIP code is required"),
  body("type")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Invalid address type"),
  handleValidationErrors,
];

// Booking validation
const validateBooking = [
  body("services")
    .isArray({ min: 1 })
    .withMessage("At least one service must be selected"),
  body("services.*.service").isMongoId().withMessage("Invalid service ID"),
  body("services.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("scheduledDate")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Scheduled date cannot be in the past");
      }
      return true;
    }),
  body("scheduledTime")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("vehicle.make")
    .trim()
    .notEmpty()
    .withMessage("Vehicle make is required"),
  body("vehicle.model")
    .trim()
    .notEmpty()
    .withMessage("Vehicle model is required"),
  body("vehicle.year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Invalid vehicle year"),
  body("vehicle.color")
    .trim()
    .notEmpty()
    .withMessage("Vehicle color is required"),
  body("vehicle.type")
    .isIn(["sedan", "suv", "truck", "luxury", "other"])
    .withMessage("Invalid vehicle type"),
  body("address.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.zipCode").trim().notEmpty().withMessage("ZIP code is required"),
  body("frequency")
    .optional()
    .isIn(["one-time", "weekly", "bi-weekly", "monthly"])
    .withMessage("Invalid frequency selection"),
  handleValidationErrors,
];

// Payment validation
const validatePayment = [
  body("bookingId").isMongoId().withMessage("Invalid booking ID"),
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment method ID is required"),
  handleValidationErrors,
];

// Support ticket validation
const validateSupportTicket = [
  body("subject")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Subject must be between 5 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("category")
    .isIn([
      "booking",
      "payment",
      "service",
      "technical",
      "general",
      "complaint",
      "suggestion",
    ])
    .withMessage("Invalid category selection"),
  body("booking").optional().isMongoId().withMessage("Invalid booking ID"),
  handleValidationErrors,
];

// Support ticket response validation
const validateTicketResponse = [
  body("content")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Response content is required"),
  body("isInternal")
    .optional()
    .isBoolean()
    .withMessage("isInternal must be a boolean"),
  handleValidationErrors,
];

// ID parameter validation
const validateId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Pagination validation
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

// Search validation
const validateSearch = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Search query must be at least 2 characters long"),
  handleValidationErrors,
];

// Date range validation
const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format")
    .custom((endDate, { req }) => {
      if (
        req.query.startDate &&
        new Date(endDate) <= new Date(req.query.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  handleValidationErrors,
];

// Vehicle validation
const validateVehicle = [
  body("make")
    .trim()
    .notEmpty()
    .withMessage("Vehicle make is required")
    .isLength({ max: 50 })
    .withMessage("Make cannot exceed 50 characters"),
  body("model")
    .trim()
    .notEmpty()
    .withMessage("Vehicle model is required")
    .isLength({ max: 50 })
    .withMessage("Model cannot exceed 50 characters"),
  body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Valid year is required"),
  body("color")
    .trim()
    .notEmpty()
    .withMessage("Vehicle color is required")
    .isLength({ max: 30 })
    .withMessage("Color cannot exceed 30 characters"),
  body("type")
    .isIn(["sedan", "suv", "truck", "luxury", "other"])
    .withMessage("Valid vehicle type is required"),
  body("licensePlate")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("License plate cannot exceed 20 characters"),
  body("vin")
    .optional()
    .trim()
    .isLength({ min: 17, max: 17 })
    .withMessage("VIN must be exactly 17 characters"),
  body("nickname")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Nickname cannot exceed 50 characters"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateAddress,
  validateBooking,
  validatePayment,
  validateSupportTicket,
  validateTicketResponse,
  validateId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateVehicle,
};
