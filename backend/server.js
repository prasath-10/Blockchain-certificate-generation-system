require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware Configuration
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// Step 1: Upload Folder Setup
// ==========================================
// Path to the 'uploads' folder where temporary files will be saved
const uploadsDir = path.join(__dirname, "uploads");

// Automatically create the 'uploads' folder if it doesn't exist yet
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==========================================
// Step 2: Configure Multer Storage Engine
// ==========================================
// Multer is Express middleware for processing file uploads (multipart/form-data).
// diskStorage lets us configure where uploaded files are saved and what they are named.
const storage = multer.diskStorage({
  // Specify destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  // Generate a unique filename using timestamp + random number to avoid filename conflicts
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Create Multer upload instance using disk storage configuration
const upload = multer({
  storage: storage,
  // Limit maximum file size (e.g., 10MB) to protect the server
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ==========================================
// Step 3: Routes
// ==========================================

// Health Check Route (Basic verification that server is operational)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
  });
});

/**
 * Route: POST /api/certificates/hash
 * Description: Accepts a certificate file upload, calculates its SHA-256 cryptographic hash,
 *              and returns file metadata along with the computed hash.
 * Field Name: "certificate"
 */
app.post("/api/certificates/hash", upload.single("certificate"), (req, res) => {
  // Step 4: Basic Error Handling - Check if a file was provided in the request
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded. Please upload a certificate file using the field name 'certificate'.",
    });
  }

  try {
    // Step 5: Read the uploaded file from the temporary uploads directory
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // Step 6: Generate SHA-256 hash of the file contents using Node.js built-in 'crypto' module
    // We format the hash as a '0x' prefixed hex string (standard 32-byte hash format for Web3 / Smart Contracts)
    const hash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Step 7: Clean up - Delete the temporary file from /uploads directory after computing hash
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Warning: Could not remove temporary upload file:", unlinkErr);
      }
    });

    // Step 8: Return JSON response containing filename, SHA-256 hash, and file size in bytes
    return res.status(200).json({
      fileName: req.file.originalname,
      hash: hash,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error("Error calculating file hash:", error);
    return res.status(500).json({
      error: "Failed to process the certificate file and calculate hash.",
    });
  }
});

// ==========================================
// Global Error Handler Middleware
// ==========================================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      error: `An unexpected server error occurred: ${err.message}`,
    });
  }
  next();
});

// ==========================================
// Start Express Server
// ==========================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


