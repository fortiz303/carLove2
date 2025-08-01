const express = require("express");
const passport = require("passport");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticateJWT } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
  validateId,
} = require("../middleware/validation");

// Public routes
router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  authController.facebookCallback
);

router.get("/apple", passport.authenticate("apple"));
router.get(
  "/apple/callback",
  passport.authenticate("apple", { session: false }),
  authController.appleCallback
);

// Protected routes
router.get("/me", authenticateJWT, authController.getMe);
router.post("/change-password", authenticateJWT, authController.changePassword);
router.post("/logout", authenticateJWT, authController.logout);

module.exports = router;
