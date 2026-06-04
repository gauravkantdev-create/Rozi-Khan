// ==========================================
// Import Product Model
// ==========================================

import Product from "../models/Product.js";


// ==========================================
// Create Product Controller
// ==========================================

export const createProduct = async (req, res) => {
  try {

    // ==========================================
    // Get Product Data From Request Body
    // ==========================================

    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      supplier,
    } = req.body;

    // ==========================================
    // Validation
    // ==========================================

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // ==========================================
    // Create Product
    // ==========================================

    const product = await Product.create({
      name,
      description,
      price,
      category,
      images,
      stock,
      supplier,
      createdBy: req.user._id,
    });

    // ==========================================
    // Success Response
    // ==========================================

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==========================================
// Get All Products Controller
// ==========================================

export const getProducts = async (req, res) => {
  try {

    // ==========================================
    // Search Keyword
    // ==========================================

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    // ==========================================
    // Category Filter
    // ==========================================

    const categoryFilter = req.query.category
      ? {
          category: req.query.category,
        }
      : {};

    // ==========================================
    // Pagination
    // ==========================================

    const pageSize = Math.min(Number(req.query.limit) || 8, 100);

    const page = Number(req.query.page) || 1;

    // ==========================================
    // Total Products Count
    // ==========================================

    const totalProducts = await Product.countDocuments({
      ...keyword,
      ...categoryFilter,
    });

    // ==========================================
    // Fetch Products
    // ==========================================

    const products = await Product.find({
      ...keyword,
      ...categoryFilter,
    })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // ==========================================
    // Success Response
    // ==========================================

    res.status(200).json({
      success: true,
      page,
      pages: Math.ceil(totalProducts / pageSize),
      totalProducts,
      products,
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==========================================
// Get Single Product Controller
// ==========================================

export const getSingleProduct = async (req, res) => {
  try {

    // ==========================================
    // Find Product By ID
    // ==========================================

    const product = await Product.findById(req.params.id);

    // ==========================================
    // Check Product Exists
    // ==========================================

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // Success Response
    // ==========================================

    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==========================================
// Update Product Controller
// ==========================================

export const updateProduct = async (req, res) => {
  try {

    // ==========================================
    // Find Product
    // ==========================================

    let product = await Product.findById(req.params.id);

    // ==========================================
    // Check Product Exists
    // ==========================================

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // Update Product
    // ==========================================

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    // ==========================================
    // Success Response
    // ==========================================

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==========================================
// Delete Product Controller
// ==========================================

export const deleteProduct = async (req, res) => {
  try {

    // ==========================================
    // Find Product
    // ==========================================

    const product = await Product.findById(req.params.id);

    // ==========================================
    // Check Product Exists
    // ==========================================

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // Delete Product
    // ==========================================

    await product.deleteOne();

    // ==========================================
    // Success Response
    // ==========================================

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {

    // ==========================================
    // Error Response
    // ==========================================

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==========================================
// Create Product Review Controller
// ==========================================

export const createProductReview = async (req, res) => {
  try {

    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const numericRating = Number(rating);
    const trimmedComment = comment?.trim();

    if (!numericRating || numericRating < 1 || numericRating > 5 || !trimmedComment) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating between 1 and 5 and a review comment",
      });
    }

    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: numericRating,
      comment: trimmedComment,
    });

    product.numReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((total, review) => total + review.rating, 0) /
      product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      product,
      review: product.reviews[product.reviews.length - 1],
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
