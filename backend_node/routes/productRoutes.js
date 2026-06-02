// ==========================================
// Import Express
// ==========================================

import express from "express";


// ==========================================
// Import Controllers
// ==========================================

import {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from "../controllers/productController.js";


// ==========================================
// Import Middleware
// ==========================================

import { authorizeRoles, protect } from "../middleware/authMiddleware.js";


// ==========================================
// Initialize Router
// ==========================================

const router = express.Router();


// ==========================================
// Product Routes
// ==========================================


// ==========================================
// Create Product Route
// Protected Route
// ==========================================

router.post("/", protect, authorizeRoles("admin"), createProduct);


// ==========================================
// Get All Products Route
// Public Route
// ==========================================

router.get("/", getProducts);


// ==========================================
// Get Single Product Route
// Public Route
// ==========================================

router.get("/:id", getSingleProduct);


// ==========================================
// Create Product Review Route
// Protected Route
// ==========================================

router.post("/:id/reviews", protect, createProductReview);


// ==========================================
// Update Product Route
// Protected Route
// ==========================================

router.put("/:id", protect, authorizeRoles("admin"), updateProduct);


// ==========================================
// Delete Product Route
// Protected Route
// ==========================================

router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);


// ==========================================
// Export Router
// ==========================================

export default router;
