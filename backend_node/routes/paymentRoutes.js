import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — frontend needs the key before user might be on checkout
router.get("/key", getRazorpayKey);

// Protected — user must be logged in to create orders / verify
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

export default router;
