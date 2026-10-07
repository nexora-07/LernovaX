const express = require("express");

const { rateLimit } = require("express-rate-limit");

const authController = require("../controllers/authcontroller");

const { protectRoute } = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    status: "fail",
    message: "Too many authentication attempts. Try again later.",
  },
});

router.post("/signup", authLimiter, authController.signup);

router.post(
  "/signup/instructor",
  authLimiter,
  authController.signupInstructor
);

router.post(
  "/signup/admin",
  authLimiter,
  authController.signupAdmin
);

router.post("/verify-email", authLimiter, authController.verifyEmail);

router.post("/login", authLimiter, authController.login);

router.post(
  "/login/instructor",
  authLimiter,
  authController.loginInstructor
);

router.post("/login/admin", authLimiter, authController.loginAdmin);

router.get("/me", protectRoute, authController.getCurrentUser);

module.exports = router;