const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/serviceController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const { validateId, validatePagination } = require("../middleware/validation");

// Public routes
router.get("/", validatePagination, serviceController.getAllServices);
router.get("/popular", serviceController.getPopularServices);
router.get("/category/:category", serviceController.getServicesByCategory);
router.get("/:id", validateId, serviceController.getService);
router.post("/calculate-price", serviceController.calculatePrice);

// Admin routes
router.post(
  "/",
  authenticateJWT,
  authorize("admin"),
  serviceController.createService
);
router.put(
  "/:id",
  authenticateJWT,
  authorize("admin"),
  validateId,
  serviceController.updateService
);
router.delete(
  "/:id",
  authenticateJWT,
  authorize("admin"),
  validateId,
  serviceController.deleteService
);
router.get(
  "/admin/stats",
  authenticateJWT,
  authorize("admin"),
  serviceController.getServiceStats
);
router.post(
  "/seed",
  authenticateJWT,
  authorize("admin"),
  serviceController.seedDefaultServices
);

module.exports = router;
