require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

// ==========================================
// Database & Blockchain Setup
// ==========================================
// 1. Connect to MongoDB using our helper file (backend/db.js)
const connectDB = require("./db");
// 2. Import Mongoose Certificate model for saving and fetching metadata off-chain
const Certificate = require("./models/Certificate");
// 3. Import pre-configured contract instance for Ganache smart contract calls
const { contract } = require("./blockchain");

// Establish database connection
connectDB();

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
// Path to the 'uploads' folder where temporary files will be saved during requests
const uploadsDir = path.join(__dirname, "uploads");

// Automatically create the 'uploads' folder if it doesn't exist yet
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ==========================================
// Step 2: Configure Multer Storage Engine
// ==========================================
// Multer is Express middleware for processing file uploads (multipart/form-data).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==========================================
// Step 3: Routes
// ==========================================

// Health Check Route (Verifies server health)
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
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 24px; background: #f8fafc; color: #1e293b; }
        h1 { color: #0f172a; margin-top: 0; font-size: 24px; }
        h3 { color: #334155; margin-bottom: 6px; }
        p { color: #64748b; font-size: 14px; margin-top: 0; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px; margin-top: 8px; }
        input[type="file"], input[type="text"] { width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; margin-top: 8px; }
        button:hover { background: #1d4ed8; }
        button.green { background: #16a34a; }
        button.green:hover { background: #15803d; }
        button.purple { background: #7c3aed; }
        button.purple:hover { background: #6d28d9; }
        button.teal { background: #0d9488; }
        button.teal:hover { background: #0f766e; }
        pre { background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin-top: 12px; white-space: pre-wrap; word-break: break-all; }
      </style>
    </head>
    <body>
      <h1>🎓 Certificate Registry — Backend Test Page</h1>

      <!-- Section 1: Hash only -->
      <div class="card">
        <h3>1. Hash a File (no blockchain / no database)</h3>
        <p>Generates a SHA-256 hash of the uploaded file without saving anywhere.</p>
        <form id="hashForm">
          <label for="hashFile">Certificate File</label>
          <input type="file" id="hashFile" name="certificate" required />
          <button type="submit">Upload &amp; Generate Hash</button>
        </form>
        <pre id="hashResult">Select a file above and click the button...</pre>
      </div>

      <!-- Section 2: Issue on blockchain & save metadata to MongoDB -->
      <div class="card">
        <h3>2. Issue Certificate (Blockchain + MongoDB)</h3>
        <p>Hashes the file, issues it on Ganache, AND saves full metadata into MongoDB.</p>
        <form id="issueForm">
          <label for="certId">Certificate ID (unique, e.g. CERT-2026-001)</label>
          <input type="text" id="certId" placeholder="CERT-2026-001" required />
          
          <label for="holderName">Holder Name (Student / Recipient)</label>
          <input type="text" id="holderName" placeholder="Alice Smith" required />

          <label for="issuerName">Issuer Name (Authority / University)</label>
          <input type="text" id="issuerName" placeholder="State University" required />

          <label for="certType">Certificate Type</label>
          <input type="text" id="certType" placeholder="Bachelor of Science in Computer Science" />

          <label for="issueFile">Certificate File</label>
          <input type="file" id="issueFile" name="certificate" required />
          
          <button type="submit" class="green">Issue on Blockchain &amp; Save Metadata</button>
        </form>
        <pre id="issueResult">Fill in the form above and click Issue...</pre>
      </div>

      <!-- Section 3: Verify certificate -->
      <div class="card">
        <h3>3. Verify Certificate (Blockchain + MongoDB Metadata)</h3>
        <p>Re-hashes file, verifies on-chain, and fetches metadata from MongoDB.</p>
        <form id="verifyForm">
          <label for="verifyCertId">Certificate ID</label>
          <input type="text" id="verifyCertId" placeholder="CERT-2026-001" required />
          <label for="verifyFile">Certificate File (Original unmodified file)</label>
          <input type="file" id="verifyFile" name="certificate" required />
          <button type="submit" class="purple">Verify Certificate</button>
        </form>
        <pre id="verifyResult">Fill in the form above and click Verify...</pre>
      </div>

      <!-- Section 4: Get Certificate Details by ID -->
      <div class="card">
        <h3>4. Fetch Certificate Details by ID (GET /api/certificates/:id)</h3>
        <p>Fetches stored MongoDB metadata and smart contract on-chain info for any Certificate ID.</p>
        <form id="getForm">
          <label for="getCertId">Certificate ID</label>
          <input type="text" id="getCertId" placeholder="CERT-2026-001" required />
          <button type="submit" class="teal">Fetch Certificate Details</button>
        </form>
        <pre id="getResult">Enter Certificate ID and click Fetch...</pre>
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
          const holderName = document.getElementById('holderName').value.trim();
          const issuerName = document.getElementById('issuerName').value.trim();
          const certType = document.getElementById('certType').value.trim();
          const fileInput = document.getElementById('issueFile');

          if (!certId || !holderName || !issuerName || !fileInput.files[0]) return;

          const formData = new FormData();
          formData.append('certificateId', certId);
          formData.append('holderName', holderName);
          formData.append('issuerName', issuerName);
          formData.append('certificateType', certType);
          formData.append('certificate', fileInput.files[0]);

          document.getElementById('issueResult').textContent = 'Issuing on blockchain and saving to MongoDB...';
          try {
            const res = await fetch('/api/certificates/issue', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('issueResult').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('issueResult').textContent = 'Error: ' + err.message;
          }
        });

        // ---- Verify endpoint test ----
        document.getElementById('verifyForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const certId = document.getElementById('verifyCertId').value.trim();
          const fileInput = document.getElementById('verifyFile');
          if (!certId || !fileInput.files[0]) return;
          const formData = new FormData();
          formData.append('certificateId', certId);
          formData.append('certificate', fileInput.files[0]);
          document.getElementById('verifyResult').textContent = 'Querying blockchain & MongoDB...';
          try {
            const res = await fetch('/api/certificates/verify', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('verifyResult').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('verifyResult').textContent = 'Error: ' + err.message;
          }
        });

        // ---- Get Details endpoint test ----
        document.getElementById('getForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const certId = document.getElementById('getCertId').value.trim();
          if (!certId) return;
          document.getElementById('getResult').textContent = 'Fetching details...';
          try {
            const res = await fetch('/api/certificates/' + encodeURIComponent(certId));
            const data = await res.json();
            document.getElementById('getResult').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('getResult').textContent = 'Error: ' + err.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * Route: POST /api/certificates/hash
 * Description: Calculates SHA-256 hash of an uploaded file without saving to DB or Blockchain.
 */
app.post(
  "/api/certificates/hash",
  upload.single("certificate"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please upload a certificate file using field 'certificate'.",
      });
    }

    try {
      const filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      const hash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");

      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Warning: Could not remove temp upload file:", unlinkErr);
      });

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
  }
);

// ==========================================
// Route: POST /api/certificates/issue
// ==========================================
/**
 * Route: POST /api/certificates/issue
 * Description: 
 *   1. Computes SHA-256 hash of certificate file.
 *   2. Issues certificate on Ethereum smart contract via Ganache.
 *   3. Saves full certificate metadata (holderName, issuerName, certificateType, transactionHash, documentHash) into MongoDB.
 * 
 * Form Fields (multipart/form-data):
 *   - certificate     : (File, required) The certificate PDF/image
 *   - certificateId   : (String, required) Unique ID e.g. "CERT-2026-001"
 *   - holderName      : (String, required) Name of the student / certificate recipient
 *   - issuerName      : (String, required) Name of issuing institution
 *   - certificateType : (String, optional) Type of certificate e.g. "Degree"
 */
app.post(
  "/api/certificates/issue",
  upload.single("certificate"),
  async (req, res) => {
    // 1. Check file upload
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please include a 'certificate' file field.",
      });
    }

    // 2. Extract and validate text form fields
    const { certificateId, holderName, issuerName, certificateType } = req.body;

    if (!certificateId || certificateId.trim() === "") {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Missing 'certificateId' field. Please provide a unique certificate ID.",
      });
    }

    if (!holderName || holderName.trim() === "") {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Missing 'holderName' field. Please provide the holder's name.",
      });
    }

    if (!issuerName || issuerName.trim() === "") {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Missing 'issuerName' field. Please provide the issuer's name.",
      });
    }

    const trimmedCertId = certificateId.trim();

    // 3. Check if certificate ID already exists in MongoDB before hitting blockchain
    try {
      const existingCert = await Certificate.findOne({ certificateId: trimmedCertId });
      if (existingCert) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          error: `Certificate ID '${trimmedCertId}' already exists in MongoDB database.`,
        });
      }
    } catch (dbCheckErr) {
      console.warn("MongoDB pre-check notice:", dbCheckErr.message);
    }

    // 4. Compute SHA-256 Hash of uploaded file
    let hash;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      hash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (err) {
      console.error("Error reading or hashing file:", err);
      return res.status(500).json({ error: "Failed to process certificate file." });
    } finally {
      // Always remove temp upload file after hashing
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Warning: Could not delete temp file:", unlinkErr);
      });
    }

    // 5. Issue on Blockchain (Smart Contract call)
    let receipt;
    try {
      console.log(`\n=== ISSUING CERTIFICATE ON-CHAIN ===`);
      console.log(`Certificate ID : ${trimmedCertId}`);
      console.log(`Document Hash  : ${hash}`);

      // Call smart contract function issueCertificate(certificateId, hash)
      const tx = await contract.issueCertificate(trimmedCertId, hash);
      console.log(`Transaction sent! Tx Hash: ${tx.hash}`);

      // Wait for block confirmation
      receipt = await tx.wait();
      console.log(`Confirmed in block ${receipt.blockNumber} | Gas used: ${receipt.gasUsed.toString()}`);
    } catch (err) {
      console.error("Smart contract call failed:", err);
      const reason = err?.reason || err?.message || "Unknown blockchain error";
      return res.status(500).json({
        error: "Failed to issue certificate on the blockchain.",
        reason,
      });
    }

    // 6. Save Metadata to MongoDB via Mongoose
    try {
      console.log(`=== SAVING METADATA TO MONGODB ===`);
      const newCertificate = await Certificate.create({
        certificateId: trimmedCertId,
        certificateType: certificateType ? certificateType.trim() : "General Certificate",
        holderName: holderName.trim(),
        issuerName: issuerName.trim(),
        issueDate: new Date(),
        documentHash: hash,
        transactionHash: receipt.hash,
      });

      console.log(`✅ Saved in MongoDB with _id: ${newCertificate._id}`);

      // Return combined successful response
      return res.status(200).json({
        success: true,
        message: "Certificate successfully issued on blockchain and saved to MongoDB!",
        // MongoDB Metadata
        metadata: {
          id: newCertificate._id,
          certificateId: newCertificate.certificateId,
          holderName: newCertificate.holderName,
          issuerName: newCertificate.issuerName,
          certificateType: newCertificate.certificateType,
          issueDate: newCertificate.issueDate,
        },
        // Blockchain Details
        blockchain: {
          documentHash: hash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          issuedBy: receipt.from,
        },
      });
    } catch (dbErr) {
      console.error("MongoDB save error after blockchain issuance:", dbErr);
      // Even if DB fails, return transaction hash so user doesn't lose on-chain record
      return res.status(207).json({
        warning: "Issued on blockchain, but failed to save metadata to MongoDB.",
        transactionHash: receipt.hash,
        documentHash: hash,
        dbError: dbErr.message,
      });
    }
  }
);

// ==========================================
// Route: POST /api/certificates/verify
// ==========================================
/**
 * Route: POST /api/certificates/verify
 * Description:
 *   1. Re-hashes the uploaded file.
 *   2. Verifies the hash on-chain against smart contract state (`verifyCertificate`).
 *   3. Queries MongoDB to fetch and return off-chain metadata (holderName, issuerName, certificateType).
 */
app.post(
  "/api/certificates/verify",
  upload.single("certificate"),
  async (req, res) => {
    // 1. Validate inputs
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded. Please include a 'certificate' file field.",
      });
    }

    const certificateId = req.body.certificateId;
    if (!certificateId || certificateId.trim() === "") {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: "Missing 'certificateId' field. Please provide a certificate ID to verify.",
      });
    }

    const trimmedCertId = certificateId.trim();
    let hash;

    // 2. Hash uploaded file
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      hash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
    } catch (err) {
      console.error("Error hashing file for verification:", err);
      return res.status(500).json({ error: "Failed to process certificate file." });
    } finally {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Warning: Could not delete temp file:", unlinkErr);
      });
    }

    // 3. Verify on Blockchain & Fetch MongoDB Metadata
    try {
      console.log(`\n=== VERIFYING CERTIFICATE ===`);
      console.log(`Certificate ID : ${trimmedCertId}`);
      console.log(`Computed Hash  : ${hash}`);

      // Call read-only smart contract function
      const isVerified = await contract.verifyCertificate(trimmedCertId, hash);

      // Fetch metadata from MongoDB
      const metadata = await Certificate.findOne({ certificateId: trimmedCertId });

      if (isVerified) {
        // Fetch on-chain issuer & timestamp details
        const certData = await contract.getCertificate(trimmedCertId);
        const onChainIssueDate = certData.issueDate.toString();

        console.log(`Result: VERIFIED (Authentic on Blockchain)`);

        return res.status(200).json({
          verified: true,
          certificateId: trimmedCertId,
          documentHash: hash,
          message: "Certificate is authentic!",
          // On-chain info from Smart Contract
          onChain: {
            issuer: certData.issuer,
            issueTimestamp: onChainIssueDate,
          },
          // Off-chain metadata from MongoDB
          metadata: metadata
            ? {
                holderName: metadata.holderName,
                issuerName: metadata.issuerName,
                certificateType: metadata.certificateType,
                issueDate: metadata.issueDate,
                transactionHash: metadata.transactionHash,
              }
            : null,
        });
      } else {
        console.log(`Result: NOT VERIFIED (Hash mismatch or not issued)`);
        return res.status(200).json({
          verified: false,
          certificateId: trimmedCertId,
          documentHash: hash,
          message: "Certificate verification failed — document may be tampered or not registered.",
          metadata: metadata || null,
        });
      }
    } catch (err) {
      console.error("Verification query failed:", err);
      const reason = err?.reason || err?.message || "Unknown error";
      return res.status(500).json({
        error: "Failed to verify certificate.",
        reason,
      });
    }
  }
);

// ==========================================
// Route: GET /api/certificates/:certificateId
// ==========================================
/**
 * Route: GET /api/certificates/:certificateId
 * Description:
 *   Fetches full certificate details by certificate ID, aggregating:
 *     - Metadata from MongoDB (holder name, issuer name, type, dates, txHash)
 *     - Verification & issuer details from the Smart Contract on blockchain
 */
app.get("/api/certificates/:certificateId", async (req, res) => {
  const { certificateId } = req.params;

  if (!certificateId || certificateId.trim() === "") {
    return res.status(400).json({ error: "Certificate ID parameter is required." });
  }

  const trimmedCertId = certificateId.trim();

  try {
    console.log(`\n=== FETCHING CERTIFICATE DETAILS FOR: ${trimmedCertId} ===`);

    // 1. Fetch metadata document from MongoDB
    const metadata = await Certificate.findOne({ certificateId: trimmedCertId });

    // 2. Fetch on-chain record from Smart Contract
    let onChain = null;
    let existsOnChain = false;

    try {
      const certData = await contract.getCertificate(trimmedCertId);
      // Check if certificate exists on-chain (non-empty issuer address)
      if (certData && certData.issuer !== "0x0000000000000000000000000000000000000000") {
        existsOnChain = true;
        onChain = {
          issuerAddress: certData.issuer,
          documentHash: certData.documentHash,
          issueTimestamp: certData.issueDate.toString(),
        };
      }
    } catch (contractErr) {
      // Contract throws revert error if certificate ID does not exist on-chain
      console.log(`Notice: Certificate '${trimmedCertId}' not found on-chain.`);
    }

    // 3. Handle non-existent certificate
    if (!metadata && !existsOnChain) {
      return res.status(404).json({
        error: `Certificate with ID '${trimmedCertId}' was not found in database or blockchain.`,
      });
    }

    // 4. Return combined certificate report
    return res.status(200).json({
      certificateId: trimmedCertId,
      status: existsOnChain ? "Issued & Active" : "Metadata Only",
      existsInDatabase: !!metadata,
      existsOnBlockchain: existsOnChain,
      metadata: metadata || null,
      onChain: onChain,
    });
  } catch (err) {
    console.error("Error fetching certificate details:", err);
    return res.status(500).json({
      error: "Internal server error fetching certificate details.",
      details: err.message,
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
  console.log(`🚀 Server running on port ${PORT}`);
});
