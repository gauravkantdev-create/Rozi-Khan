// ==========================================
// Import Mongoose
// ==========================================

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Product Schema
// ==========================================

const productSchema = new mongoose.Schema(
  {

    // Product Name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Product Description
    description: {
      type: String,
      required: true,
    },

    // Product Price
    price: {
      type: Number,
      required: true,
    },

    // Product Category
    category: {
      type: String,
      required: true,
    },

    // Product Images
    images: [
      {
        type: String,
      },
    ],

    // Product Stock
    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    // Product Ratings
    ratings: {
      type: Number,
      default: 0,
    },

    // Product Reviews
    reviews: [reviewSchema],

    // Total Reviews Count
    numReviews: {
      type: Number,
      default: 0,
    },

    // Product Supplier
    supplier: {
      type: String,
    },

    // User Who Added Product
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },

  },
  {
    timestamps: true,
  }
);


// ==========================================
// Export Product Model
// ==========================================

const Product = mongoose.model("Product", productSchema);

export default Product;
