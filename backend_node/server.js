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

// ==========================================
// Database Connection
// ==========================================

import connectDB from "./config/db.js";

// ==========================================
// Routes
// ==========================================

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// ==========================================
// Load Environment Variables
// ==========================================

dotenv.config();

const resendFrom = process.env.RESEND_FROM_EMAIL || "";
if (resendFrom.includes("@resend.dev") || !resendFrom) {
  console.warn("=================================");
  console.warn(" EMAIL: Using Resend TEST sender.");
  console.warn(" OTP will NOT reach random users until you:");
  console.warn(" 1) Verify your domain at resend.com/domains");
  console.warn(" 2) Set RESEND_FROM_EMAIL=RoziKhan <no-reply@yourdomain.com>");
  console.warn("=================================");
}

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const allowlist = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "https://rozi-khan.vercel.app",
    "https://rozi-khan.onrender.com",
  ]);

  if (allowlist.has(origin)) return true;

  // Allow ALL Vercel preview deployments
  // e.g. https://rozi-khan-j103hdoda-gauravkantdev-9489s-projects.vercel.app
    try {
      const { hostname } = new URL(origin);
      // Allow Vercel previews and Render deployments
      if (hostname.endsWith(".vercel.app")) return true;
      if (hostname.endsWith(".onrender.com")) return true;
      return false;
    } catch {
      return false;
    }
};

const buildCorsOptions = () => ({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      // Reflect exact origin (required when credentials: true)
      return callback(null, origin || true);
    }

    console.warn("[cors] blocked origin:", origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
});

// ==========================================
// Start Server Function
// ==========================================

const startServer = async () => {
  try {

    // ==========================================
    // Connect MongoDB Database
    // ==========================================

    await connectDB();

    // ==========================================
    // Initialize Express App
    // ==========================================

    const app = express();

    // ==========================================
    // Security Middleware
    // ==========================================

    // Configure Helmet but ensure Cross-Origin-Resource-Policy is set to allow
    // cross-origin use for uploaded images. The default Helmet settings may set
    // this to 'same-origin' which blocks images used on other origins.
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      })
    );

    // ==========================================
    // Logging Middleware
    // ==========================================

    app.use(morgan("dev"));

    // ==========================================
    // CORS Configuration
    // ==========================================

    const corsOptions = buildCorsOptions();
    app.use(cors(corsOptions));
    app.options(/.*/, cors(corsOptions));

    // ==========================================
    // Body Parser Middleware
    // ==========================================

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ==========================================
    // Cookie Parser Middleware
    // ==========================================

    app.use(cookieParser());

    // ==========================================
    // API Routes
    // ==========================================

    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/payment", paymentRoutes);

    // ==========================================
    // Static Folder Setup
    // ==========================================

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Serve uploads and allow cross-origin image requests
    app.use(
      "/uploads",
      express.static(path.join(__dirname, "uploads"), {
        setHeaders(res, filePath) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        },
      })
    );

    // ==========================================
    // Test Route
    // ==========================================

    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "RoziKhan API is running successfully 🚀",
      });
    });

    // ==========================================
    // Global Error Handler (JSON)
    // ==========================================

    app.use((err, req, res, next) => {
      console.error("[server] error:", err);
      res.status(500).json({
        success: false,
        message: err?.message || "Internal Server Error",
      });
    });

    // ==========================================
    // Define Server Port
    // ==========================================

    const PORT = process.env.PORT || 5000;

    // ==========================================
    // Start Express Server
    // ==========================================

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

// ==========================================
// Run Server
// ==========================================

startServer();