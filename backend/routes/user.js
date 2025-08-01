const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const {
  validateProfileUpdate,
  validateAddress,
  validateId,
} = require("../middleware/validation");

// All routes require authentication
router.use(authenticateJWT);

// Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", validateProfileUpdate, userController.updateProfile);
router.put("/preferences", userController.updatePreferences);
router.get("/stats", userController.getUserStats);

// Address routes
router.get("/addresses", userController.getAddresses);
router.post("/addresses", validateAddress, userController.addAddress);
router.put(
  "/addresses/:addressId",
  validateAddress,
  userController.updateAddress
);
router.delete("/addresses/:addressId", userController.deleteAddress);
router.get("/addresses/default", userController.getDefaultAddress);
router.put("/addresses/:addressId/default", userController.setDefaultAddress);

// Account management
router.delete("/account", userController.deleteAccount);

// Admin routes
router.get("/admin/staff", authorize("admin"), userController.getStaffMembers);

module.exports = router;
