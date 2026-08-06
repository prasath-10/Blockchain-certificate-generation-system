// ============================================================
// Mongoose Schema & Model: Certificate (backend/models/Certificate.js)
// ============================================================
// Mongoose schemas define the structure of documents saved in MongoDB collections.
// This model stores certificate metadata off-chain (holder name, issuer name, type)
// alongside the cryptographic hash and blockchain transaction hash for reference.
// ============================================================

const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    // Unique identifier for the certificate (e.g., "CERT-2026-001")
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true, // Ensures no duplicate certificate IDs in the database
      trim: true,   // Removes trailing and leading whitespace
    },

    // Category / type of certificate (e.g., "Degree", "Birth Certificate", "Diploma")
    certificateType: {
      type: String,
      trim: true,
      default: "General Certificate",
    },

    // Name of the recipient / holder of the certificate
    holderName: {
      type: String,
      required: [true, "Holder name is required"],
      trim: true,
    },

    // Name of the issuing organization / authority (e.g., "University of Blockchain")
    issuerName: {
      type: String,
      required: [true, "Issuer name is required"],
      trim: true,
    },

    // Date when certificate was issued (Defaults to current timestamp)
    issueDate: {
      type: Date,
      default: Date.now,
    },

    // Cryptographic SHA-256 hash of the uploaded document (0x-prefixed hex string)
    // Matches the documentHash saved on the blockchain smart contract!
    documentHash: {
      type: String,
      required: [true, "Document hash is required"],
      trim: true,
    },

    // Ethereum / Ganache transaction hash returned when issuing the certificate on-chain
    transactionHash: {
      type: String,
      trim: true,
    },
  },
  {
    // Automatically creates `createdAt` and `updatedAt` timestamps in MongoDB
    timestamps: true,
  }
);

// Create and export the Mongoose model named "Certificate"
// Mongoose automatically maps this to a collection named "certificates" (pluralized)
module.exports = mongoose.model("Certificate", certificateSchema);
