// ==========================================
// Import Required Packages
// ==========================================

// JWT Package
import jwt from "jsonwebtoken";

// Password Hashing Package
import bcrypt from "bcryptjs";

// User Model
import User from "../models/Users.js";
import EmailOtp from "../models/EmailOtp.js";
import { sendOtpEmail } from "../utils/email.js";
import { getUserRole } from "../utils/roles.js";

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const isStrongPassword = (password) => PASSWORD_RULE.test(password);

const normalizeEmail = (email = "") => email.toLowerCase().trim();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sendRegisterOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    console.log("[auth] sendRegisterOtp request:", { email });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const otp = generateOtp();

    await EmailOtp.deleteMany({ email });
    await EmailOtp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const emailResult = await sendOtpEmail(email, otp);
    console.log("[auth] OTP email sent:", {
      email,
      provider: "resend",
      id: emailResult?.data?.id,
      error: emailResult?.error,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify before registration.",
      provider: "resend",
    });
  } catch (error) {
    console.error("[auth] sendRegisterOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};


// ==========================================
// Register User Controller
// ==========================================

export const registerUser = async (req, res) => {
  try {

    // ==========================================
    // Get Data From Request Body
    // ==========================================

    const { name, email, password, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    console.log("[auth] registerUser request:", { email: normalizedEmail, name });

    // ==========================================
    // Validation
    // ==========================================

    if (!name || !normalizedEmail || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, OTP, and password",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    // ==========================================
    // Check Existing User
    // ==========================================

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const otpRecord = await EmailOtp.findOne({
      email: normalizedEmail,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please verify your email again.",
      });
    }

    // ==========================================
    // Hash Password
    // ==========================================

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    // ==========================================
    // Create New User
    // ==========================================

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isEmailVerified: true,
    });

    otpRecord.verified = true;
    await otpRecord.save();

    // ==========================================
    // Success Response
    // ==========================================

    res.status(201).json({
      success: true,
      message: "User registered successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    console.error("[auth] registerUser error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};


// ==========================================
// Login User Controller
// ==========================================

export const loginUser = async (req, res) => {
  try {

    // ==========================================
    // Get Email & Password
    // ==========================================

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    console.log("[auth] loginUser request:", { email: normalizedEmail });

    // ==========================================
    // Validation
    // ==========================================

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // ==========================================
    // Check User Exists
    // ==========================================

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before login",
      });
    }

    // ==========================================
    // Compare Password
    // ==========================================

    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ==========================================
    // Generate JWT Token
    // ==========================================

    const role = getUserRole(user);

    const token = jwt.sign(
      {
        id: user._id,
        role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ==========================================
    // Success Response
    // ==========================================

    res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    console.error("[auth] loginUser error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};
