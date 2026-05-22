// ==========================================
// Import Required Packages
// ==========================================

// JWT Package
import jwt from "jsonwebtoken";

// User Model
import User from "../models/Users.js";
import { getUserRole } from "../utils/roles.js";


// ==========================================
// Protect Route Middleware
// ==========================================

export const protect = async (req, res, next) => {
  try {

    let token;

    // ==========================================
    // Check Token In Headers
    // ==========================================

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {

      // ==========================================
      // Get Token From Header
      // ==========================================

      token = req.headers.authorization.split(" ")[1];

      // ==========================================
      // Verify JWT Token
      // ==========================================

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // ==========================================
      // Find User From Token
      // ==========================================

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found",
        });
      }

      req.user.role = getUserRole(req.user);

      // ==========================================
      // Continue To Next Middleware
      // ==========================================

      next();

    } else {

      // ==========================================
      // Token Missing
      // ==========================================

      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });

    }

  } catch (error) {

    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });

  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = getUserRole(req.user);

    if (!req.user || !roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};
