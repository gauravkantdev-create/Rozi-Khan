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
  const filetypes = /jpe?g|png|webp|gif/i;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Images only (jpeg, jpg, png, webp, gif)!"), false);
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;
