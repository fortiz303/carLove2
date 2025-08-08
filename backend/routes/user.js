const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const {
  validateProfileUpdate,
  validateAddress,
  validateId,
  validateVehicle,
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
  "/addresses/:id",
  validateId,
  validateAddress,
  userController.updateAddress
);
router.delete("/addresses/:id", validateId, userController.deleteAddress);
router.get("/addresses/default", userController.getDefaultAddress);
router.put(
  "/addresses/:id/default",
  validateId,
  userController.setDefaultAddress
);

// Vehicle routes
router.get("/vehicles", userController.getVehicles);
router.post("/vehicles", validateVehicle, userController.addVehicle);
router.put(
  "/vehicles/:id",
  validateId,
  validateVehicle,
  userController.updateVehicle
);
router.delete("/vehicles/:id", validateId, userController.deleteVehicle);
router.put(
  "/vehicles/:id/default",
  validateId,
  userController.setDefaultVehicle
);
router.get("/vehicles/default", userController.getDefaultVehicle);

// Account management
router.delete("/account", userController.deleteAccount);

// Admin routes
router.get("/admin/staff", authorize("admin"), userController.getStaffMembers);

module.exports = router;
