// ==========================================
// Import Express
// ==========================================

import express from "express";


// ==========================================
// Import Controllers
// ==========================================

import {
  registerUser,
  loginUser,
  sendRegisterOtp,
} from "../controllers/authController.js";


// ==========================================
// Import Middleware
// ==========================================

import { protect } from "../middleware/authMiddleware.js";


// ==========================================
// Initialize Router
// ==========================================

const router = express.Router();


// ==========================================
// Public Routes
// ==========================================


// ==========================================
// Register User Route
// ==========================================

router.post("/send-otp", sendRegisterOtp);

router.post("/register", registerUser);


// ==========================================
// Login User Route
// ==========================================

router.post("/login", loginUser);


// ==========================================
// Protected Routes
// ==========================================


// ==========================================
// User Profile Route
// ==========================================

router.get("/profile", protect, (req, res) => {

  res.status(200).json({
    success: true,
    message: "Welcome to protected profile route 🔥",
    user: req.user,
  });

});


// ==========================================
// Export Router
// ==========================================

export default router;
