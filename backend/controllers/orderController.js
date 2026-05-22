import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const toNumber = (value) => Number(value || 0);
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const requiredAddressFields = ["fullName", "address", "city", "state", "postalCode"];

const validateAddress = (address, label) => {
  if (!address) return `${label} details are required`;

  const missingField = requiredAddressFields.find((field) => !address[field]?.trim());
  if (missingField) return `${label} ${missingField} is required`;

  return "";
};

export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      itemsPrice,
      platformFee,
      shippingPrice,
      discount,
      totalPrice,
    } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items provided",
      });
    }

    const shippingError = validateAddress(shippingAddress, "Shipping");
    const billingError = validateAddress(billingAddress, "Billing");

    if (shippingError || billingError) {
      return res.status(400).json({
        success: false,
        message: shippingError || billingError,
      });
    }

    const normalizedItems = orderItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: toNumber(item.price),
      image: item.image,
      category: item.category,
      supplier: item.supplier,
      quantity: Math.max(toNumber(item.quantity), 1),
    }));

    for (const item of normalizedItems) {
      if (!item.name || item.price < 0 || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each order item must include name, price, and quantity",
        });
      }

      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const product = await Product.findById(item.productId);
        if (product && Number(product.stock || 0) < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `${product.name} has only ${product.stock} units available`,
          });
        }
      }
    }

    const calculatedItemsPrice = normalizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      orderItems: normalizedItems,
      shippingAddress,
      billingAddress,
      paymentMethod: paymentMethod || "Razorpay",
      itemsPrice: toNumber(itemsPrice) || calculatedItemsPrice,
      platformFee: toNumber(platformFee),
      shippingPrice: toNumber(shippingPrice),
      discount: toNumber(discount),
      totalPrice: toNumber(totalPrice) || calculatedItemsPrice,
      status: "Processing",
      statusHistory: [{ status: "Processing", note: "Order placed by customer" }],
      paymentStatus: paymentMethod === "Cash on delivery" ? "Pending" : "Paid",
    });

    await Promise.all(
      normalizedItems
        .filter((item) => item.productId && mongoose.Types.ObjectId.isValid(item.productId))
        .map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          })
        )
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email role");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner = order.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you cannot access this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, keyword = "" } = req.query;
    const filter = {};

    if (status && ORDER_STATUSES.includes(status)) filter.status = status;

    const orders = await Order.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    const normalizedKeyword = keyword.toLowerCase().trim();
    const filteredOrders = normalizedKeyword
      ? orders.filter((order) => {
          const haystack = [
            order._id.toString(),
            order.user?.name,
            order.user?.email,
            order.shippingAddress?.fullName,
            order.shippingAddress?.city,
            order.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedKeyword);
        })
      : orders;

    return res.status(200).json({
      success: true,
      orders: filteredOrders,
      stats: buildOrderStats(orders),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id).populate("user", "name email role");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      changedAt: new Date(),
    });

    if (status === "Cancelled" && !order.cancelledAt) {
      order.cancelReason = note || "Cancelled by admin";
      order.cancelledAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (["Shipped", "Delivered", "Cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled after it is ${order.status.toLowerCase()}`,
      });
    }

    order.status = "Cancelled";
    order.cancelReason = req.body.reason || "Cancelled by customer";
    order.cancelledAt = new Date();
    order.statusHistory.push({
      status: "Cancelled",
      note: order.cancelReason,
      changedAt: order.cancelledAt,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const buildOrderStats = (orders) => {
  return orders.reduce(
    (stats, order) => {
      stats.totalOrders += 1;
      stats.totalRevenue += toNumber(order.totalPrice);
      stats.pendingOrders += order.status === "Pending" ? 1 : 0;
      stats.processingOrders += order.status === "Processing" ? 1 : 0;
      stats.deliveredOrders += order.status === "Delivered" ? 1 : 0;
      stats.cancelledOrders += order.status === "Cancelled" ? 1 : 0;
      return stats;
    },
    {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    }
  );
};
