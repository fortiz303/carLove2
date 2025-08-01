const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const { authenticateJWT, authorize } = require("../middleware/auth");
const {
  validateSupportTicket,
  validateTicketResponse,
  validateId,
  validatePagination,
} = require("../middleware/validation");

// All routes require authentication
router.use(authenticateJWT);

// User support routes
router.post("/tickets", validateSupportTicket, supportController.createTicket);
router.get("/tickets", validatePagination, supportController.getUserTickets);
router.get("/tickets/:id", validateId, supportController.getTicket);
router.post(
  "/tickets/:id/respond",
  validateId,
  validateTicketResponse,
  supportController.respondToTicket
);
router.post("/tickets/:id/close", validateId, supportController.closeTicket);
router.post(
  "/tickets/:id/satisfaction",
  validateId,
  supportController.addSatisfaction
);

// Admin/Staff routes
router.get(
  "/admin/tickets",
  authorize("admin"),
  validatePagination,
  supportController.getAllTickets
);
router.put(
  "/admin/tickets/:id/assign",
  authorize("admin"),
  validateId,
  supportController.assignTicket
);
router.post(
  "/admin/tickets/:id/resolve",
  authorize("admin"),
  validateId,
  supportController.resolveTicket
);
router.post(
  "/admin/tickets/:id/escalate",
  authorize("admin"),
  validateId,
  supportController.escalateTicket
);
router.get(
  "/admin/stats",
  authorize("admin"),
  supportController.getSupportStats
);

module.exports = router;
