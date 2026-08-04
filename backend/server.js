require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

// ==========================================
// Blockchain Setup
// ==========================================
// Import the pre-configured contract instance from our blockchain module.
// This gives us a ready-to-use ethers.Contract object pointing at the
// deployed CertificateRegistry on Ganache, signed by the deployer wallet.
const { contract } = require("./blockchain");

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

// Interactive Browser Test Page Route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Certificate Registry — Backend Test</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 680px; margin: 40px auto; padding: 24px; }
        h1 { color: #1e293b; margin-top: 0; font-size: 22px; }
        h3 { color: #334155; margin-bottom: 6px; }
        p { color: #64748b; font-size: 14px; margin-top: 0; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
        label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px; }
        input[type="file"], input[type="text"] { width: 100%; box-sizing: border-box; margin-bottom: 12px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
        button:hover { background: #1d4ed8; }
        button.green { background: #16a34a; }
        button.green:hover { background: #15803d; }
        pre { background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-top: 12px; white-space: pre-wrap; word-break: break-all; }
      </style>
    </head>
    <body>
      <h1>🎓 Certificate Registry — Backend Test Page</h1>

      <!-- Section 1: Hash only -->
      <div class="card">
        <h3>1. Hash a File (no blockchain)</h3>
        <p>Generates a SHA-256 hash of the uploaded file without writing to the blockchain.</p>
        <form id="hashForm">
          <label for="hashFile">Certificate File</label>
          <input type="file" id="hashFile" name="certificate" required />
          <button type="submit">Upload &amp; Generate Hash</button>
        </form>
        <pre id="hashResult">Select a file above and click the button...</pre>
      </div>

      <!-- Section 2: Issue on blockchain -->
      <div class="card">
        <h3>2. Issue Certificate on Blockchain</h3>
        <p>Hashes the file AND calls <code>issueCertificate()</code> on the smart contract via Ganache.</p>
        <form id="issueForm">
          <label for="certId">Certificate ID (unique, e.g. CERT-2026-001)</label>
          <input type="text" id="certId" placeholder="CERT-2026-001" required />
          <label for="issueFile">Certificate File</label>
          <input type="file" id="issueFile" name="certificate" required />
          <button type="submit" class="green">Issue on Blockchain</button>
        </form>
        <pre id="issueResult">Fill in the form above and click Issue...</pre>
      </div>

      <script>
        // ---- Hash endpoint test ----
        document.getElementById('hashForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const fileInput = document.getElementById('hashFile');
          if (!fileInput.files[0]) return;
          const formData = new FormData();
          formData.append('certificate', fileInput.files[0]);
          document.getElementById('hashResult').textContent = 'Computing hash...';
          try {
            const res = await fetch('/api/certificates/hash', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('hashResult').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('hashResult').textContent = 'Error: ' + err.message;
          }
        });

        // ---- Issue endpoint test ----
        document.getElementById('issueForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const certId = document.getElementById('certId').value.trim();
          const fileInput = document.getElementById('issueFile');
          if (!certId || !fileInput.files[0]) return;
          const formData = new FormData();
          formData.append('certificateId', certId);
          formData.append('certificate', fileInput.files[0]);
          document.getElementById('issueResult').textContent = 'Sending transaction to Ganache... (may take a few seconds)';
          try {
            const res = await fetch('/api/certificates/issue', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('issueResult').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('issueResult').textContent = 'Error: ' + err.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});


/**
 * Route: POST /api/certificates/hash
 * Description: Accepts a certificate file upload, calculates its SHA-256 cryptographic hash,
 *              and returns file metadata along with the computed hash.
 * Field Name: "certificate"
 */
app.post(
  "/api/certificates/hash",
  (req, res, next) => {
    console.log("=== INCOMING REQUEST DEBUG ===");
    console.log("Method:", req.method);
    console.log("Content-Type Header:", req.headers["content-type"]);
    next();
  },
  upload.single("certificate"),
  (req, res) => {
    console.log("Parsed req.file:", req.file);
    console.log("Parsed req.body:", req.body);

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
// Route: POST /api/certificates/issue
// ==========================================
/**
 * This is the main blockchain integration route.
 *
 * What it does, step by step:
 *   1. Accepts a multipart/form-data POST with two fields:
 *        - "certificate"   : the file to hash (same as the /hash route)
 *        - "certificateId" : a unique string ID for this certificate
 *   2. Reads the uploaded file and computes its SHA-256 hash.
 *   3. Calls the smart contract's issueCertificate(certificateId, hash) function.
 *   4. Waits for the transaction to be mined (confirmed on-chain).
 *   5. Returns the transaction hash + certificate details as JSON.
 *
 * How multipart form fields work with Multer:
 *   When using FormData in the browser (or curl with -F), both text fields
 *   and file fields travel in the same multipart request body.
 *   After multer processes the upload, text fields appear in req.body
 *   and the file metadata appears in req.file.
 */
app.post(
  "/api/certificates/issue",
  upload.single("certificate"), // Multer processes the uploaded file first
  async (req, res) => {
    // --- Input Validation ---

    // Check that a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please include a 'certificate' file field.",
      });
    }

    // Check that a certificateId was provided as a form text field
    const certificateId = req.body.certificateId;
    if (!certificateId || certificateId.trim() === "") {
      // Clean up the uploaded file before returning the error
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Missing 'certificateId' field. Please provide a unique certificate ID.",
      });
    }

    // --- Hash Generation ---
    let hash;
    try {
      // Read the uploaded file into memory as a Buffer
      const fileBuffer = fs.readFileSync(req.file.path);

      // Generate SHA-256 hash formatted as a 0x-prefixed hex string.
      // The smart contract's documentHash parameter is type bytes32, and
      // ethers.js can accept a 0x-prefixed 32-byte hex string for bytes32.
      hash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (err) {
      console.error("Error reading or hashing file:", err);
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: "Failed to process the certificate file." });
    } finally {
      // Always delete the temp file from /uploads once we have the hash
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Warning: Could not delete temp file:", unlinkErr);
      });
    }

    // --- Smart Contract Interaction ---
    try {
      console.log(`\n=== ISSUING CERTIFICATE ON-CHAIN ===`);
      console.log(`Certificate ID : ${certificateId}`);
      console.log(`Document Hash  : ${hash}`);
      console.log(`File Name      : ${req.file.originalname}`);

      // Step A: Call the contract function.
      // contract.issueCertificate() encodes our arguments (certificateId + hash)
      // into a transaction, signs it with the deployer wallet, and sends it
      // to Ganache.  This returns a TransactionResponse immediately — the
      // transaction is in the mempool but NOT yet confirmed.
      const tx = await contract.issueCertificate(
        certificateId.trim(), // Solidity param: string memory certificateId
        hash                  // Solidity param: bytes32 documentHash
      );

      console.log(`Transaction sent! Hash: ${tx.hash}`);
      console.log(`Waiting for block confirmation...`);

      // Step B: Wait for the transaction to be mined.
      // .wait() blocks until the transaction is included in a block.
      // It returns a TransactionReceipt with details like block number and
      // gas used.  If the transaction reverts (e.g., duplicate certificate ID),
      // .wait() will throw an error which we catch below.
      const receipt = await tx.wait();

      console.log(`Confirmed in block ${receipt.blockNumber} | Gas used: ${receipt.gasUsed.toString()}`);

      // Step C: Return success response with transaction details
      return res.status(200).json({
        success: true,
        message: "Certificate successfully issued on the blockchain!",
        // Core certificate data
        certificateId: certificateId.trim(),
        documentHash: hash,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        // On-chain transaction details
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        // Issuer wallet address (the deployer account)
        issuedBy: receipt.from,
      });
    } catch (err) {
      // Common reasons this block is entered:
      //  - The certificate ID already exists on-chain (contract revert)
      //  - The signer account is not an authorized issuer
      //  - Ganache is not running / wrong RPC URL
      //  - Wrong or missing private key in .env
      console.error("Smart contract call failed:", err);

      // Try to provide a friendly error message by extracting the revert reason
      const reason = err?.reason || err?.message || "Unknown error";
      return res.status(500).json({
        error: "Failed to issue certificate on the blockchain.",
        reason,
      });
    }
  }
);

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


