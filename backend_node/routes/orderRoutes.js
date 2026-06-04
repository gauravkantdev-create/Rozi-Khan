import express from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, authorizeRoles("admin"), getAllOrders);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);
router.patch("/:id/cancel", protect, cancelOrder);

export default router;
