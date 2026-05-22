import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// ==========================================
// Initialize Razorpay Instance (Lazy Loading)
// ==========================================

let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        'Razorpay credentials not found in environment variables. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file'
      );
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const toNumber = (value) => Number(value || 0);

// ==========================================
// Get Razorpay Key (Public)
// ==========================================

export const getRazorpayKey = (req, res) => {
  return res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

// ==========================================
// Create Razorpay Order
// ==========================================

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (smallest INR unit)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayInstance = getRazorpayInstance();
    const razorpayOrder = await razorpayInstance.orders.create(options);

    return res.status(201).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

// ==========================================
// Verify Payment & Create Order
// ==========================================

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // ==========================================
    // Validate Required Payment Fields
    // ==========================================

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      });
    }

    // ==========================================
    // Verify Razorpay Signature (HMAC-SHA256)
    // ==========================================

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed — invalid signature",
      });
    }

    // ==========================================
    // Validate Order Data
    // ==========================================

    const {
      orderItems,
      shippingAddress,
      billingAddress,
      itemsPrice,
      platformFee,
      shippingPrice,
      discount,
      totalPrice,
    } = orderData;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items provided",
      });
    }

    // ==========================================
    // Normalize Order Items
    // ==========================================

    const normalizedItems = orderItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: toNumber(item.price),
      image: item.image,
      category: item.category,
      supplier: item.supplier,
      quantity: Math.max(toNumber(item.quantity), 1),
    }));

    // ==========================================
    // Check Stock Availability
    // ==========================================

    for (const item of normalizedItems) {
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

    // ==========================================
    // Calculate Items Price
    // ==========================================

    const calculatedItemsPrice = normalizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // ==========================================
    // Create Order in Database
    // ==========================================

    const order = await Order.create({
      user: req.user._id,
      orderItems: normalizedItems,
      shippingAddress,
      billingAddress,
      paymentMethod: "Razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      itemsPrice: toNumber(itemsPrice) || calculatedItemsPrice,
      platformFee: toNumber(platformFee),
      shippingPrice: toNumber(shippingPrice),
      discount: toNumber(discount),
      totalPrice: toNumber(totalPrice) || calculatedItemsPrice,
      status: "Processing",
      statusHistory: [
        { status: "Processing", note: "Payment verified via Razorpay" },
      ],
      paymentStatus: "Paid",
    });

    // ==========================================
    // Reduce Stock
    // ==========================================

    await Promise.all(
      normalizedItems
        .filter(
          (item) =>
            item.productId &&
            mongoose.Types.ObjectId.isValid(item.productId)
        )
        .map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          })
        )
    );

    // ==========================================
    // Return Success Response
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Payment verified and order created successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
