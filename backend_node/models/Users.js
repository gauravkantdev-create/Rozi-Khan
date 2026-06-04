// ==========================================
// Import Mongoose
// ==========================================

import mongoose from "mongoose";


// ==========================================
// Create User Schema
// ==========================================

const userSchema = new mongoose.Schema(
  {
    // User Full Name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // User Email
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // User Password
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },

    // Email Verification Status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // User Role
    role: {
      type: String,
      enum: ["admin", "seller", "supplier", "user"],
      default: "user",
    },
  },

  // Automatically adds createdAt & updatedAt
  {
    timestamps: true,
  }
);


// ==========================================
// Create User Model
// ==========================================

const User = mongoose.model("User", userSchema);


// ==========================================
// Export User Model
// ==========================================

export default User;
