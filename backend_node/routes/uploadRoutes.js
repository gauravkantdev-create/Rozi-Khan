import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter (ensure it's an image)
function fileFilter(req, file, cb) {
  const isImage = file.mimetype && file.mimetype.startsWith("image/");

  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error("Please upload a valid image file."), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload Single Image Route (Protected for Admins)
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  (req, res) => {
    try {
      // Ensure upload responses allow cross-origin usage in browsers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }

      // Construct URL to access the uploaded file
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        url: imageUrl,
      });
    } catch (error) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
