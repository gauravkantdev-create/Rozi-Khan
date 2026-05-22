// ==========================================
// Import Required Packages
// ==========================================

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Database Connection
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Load Environment Variables
dotenv.config();

// Start Server Function
const startServer = async () => {
  try {
    // Connect MongoDB Database
    await connectDB();

    // Initialize Express App
    const app = express();

    // Security Middleware
    app.use(helmet());

    // Logging Middleware
    app.use(morgan("dev"));

    // CORS Configuration
    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      })
    );

    // Body Parser Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Cookie Parser Middleware
    app.use(cookieParser());

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/payment", paymentRoutes);

    // Static folder setup for uploaded images
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Test Route
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "RoziKhan API is running successfully 🚀",
      });
    });

    // Define Server Port
    const PORT = process.env.PORT || 5000;

    // Start Express Server
    app.listen(PORT, () => {
      console.log("=================================");
      console.log(` Server running on port ${PORT}`);
      console.log("=================================");
    });

  } catch (error) {
    console.error("=================================");
    console.error(" Server Failed To Start ");
    console.error(` Error: ${error.message}`);
    console.error("=================================");
  }
};

// Run Server
startServer();
