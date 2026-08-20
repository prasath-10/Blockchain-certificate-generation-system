# 🎓 Online Blockchain-Based Certificate Generation and Validation System

A decentralized system for issuing, storing, and verifying government-issued certificates (birth certificates, degrees, income certificates, etc.) using blockchain technology to prevent forgery and enable instant, trustless verification.

---

## 📌 Overview

Traditional certificates (paper or PDF) are vulnerable to tampering, forgery, and slow manual verification. This project solves that by:

- Generating a **cryptographic hash (fingerprint)** of every issued certificate
- Storing that hash permanently on a **blockchain**, making it tamper-evident
- Allowing **anyone** to instantly verify a certificate's authenticity by comparing a freshly computed hash against the one stored on-chain

If even a single character in a certificate is altered after issuance, the recalculated hash will not match the blockchain record — instantly flagging the document as tampered.

---

##  Key Features

- 🔐 **Tamper-proof issuance** — certificate hashes are permanently recorded on-chain and cannot be silently altered
- ⚡ **Instant verification** — no manual calls or paperwork; verification happens in seconds
- 👤 **Role-based access** — only authorized government issuers can issue certificates
- 📷 **QR code verification** — scan to instantly check authenticity
- 🕵️ **Tamper detection** — mismatched hashes are flagged immediately
- 📜 **Full audit trail** — every issuance is permanently linked to the issuing officer's blockchain address

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity |
| Blockchain Dev Environment | Hardhat |
| Local Blockchain | Ganache |
| Blockchain Connection | Ethers.js |
| Backend | Node.js, Express.js |
| File Handling | Multer |
| Hashing | Node.js Crypto (SHA-256) |
| Frontend | React |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |

---

## 🧱 Project Architecture

```
┌─────────────┐      ┌──────────────┐      ┌───────────────────┐
│   React     │ ───▶ │   Express    │ ───▶ │  Smart Contract     │
│  Frontend   │ ◀─── │   Backend    │ ◀─── │  (CertificateRegistry) │
└─────────────┘      └──────────────┘      └───────────────────┘
                            │                         │
                            ▼                         ▼
                      ┌──────────┐             ┌─────────────┐
                      │ Database │             │   Ganache    │
                      │(Metadata)│             │ (Local Chain)│
                      └──────────┘             └─────────────┘
```

**Flow:**
1. Officer issues a certificate → backend generates a SHA-256 hash of the document
2. Hash + Certificate ID are sent to the smart contract and stored on-chain
3. Citizen receives the certificate (with QR code)
4. Verifier uploads/scans the certificate → backend recalculates the hash
5. Smart contract compares the recalculated hash to the stored hash
6. Match → ✅ Verified | Mismatch → ❌ Tampering detected

---

## 📂 Project Structure

```
BlockChain Project/
├── contracts/
│   └── CertificateRegistry.sol      # Core smart contract
├── test/
│   └── CertificateRegistry.ts       # Smart contract test suite
├── ignition/                        # Deployment modules
├── backend/
│   ├── server.js                    # Express server entry point
│   ├── blockchain.js                # Ethers.js contract connection
│   ├── contractABI.json             # Compiled contract ABI
│   ├── uploads/                     # Temporary file storage
│   └── .env                         # Environment variables (not committed)
├── frontend/                        # React application
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
├── hardhat.config.ts
└── README.md
```

---

## ⚙️ Smart Contract: `CertificateRegistry.sol`

| Function | Description |
|---|---|
| `issueCertificate(certificateId, documentHash)` | Records a new certificate on-chain. Restricted to authorized issuers. |
| `verifyCertificate(certificateId, documentHash)` | Compares a provided hash against the stored on-chain hash. Returns `true`/`false`. |
| `getCertificate(certificateId)` | Retrieves stored certificate metadata (hash, issuer, issue date). |
| `addIssuer(address)` | Admin-only function to authorize new government officers. |

**Access Control:**
- Only the contract admin can authorize new issuers
- Only authorized issuers can issue certificates
- Verification is public — anyone can verify a certificate

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- Ganache (desktop app or CLI)
- npm

### 1. Clone the repository
```bash
git clone <repo-url>
cd "BlockChain Project"
```

### 2. Install and compile smart contracts
```bash
npm install
npx hardhat compile
```

### 3. Run smart contract tests
```bash
npx hardhat test
```

### 4. Start Ganache
Open the Ganache app and note the RPC URL (default: `http://127.0.0.1:7545`).

### 5. Deploy the contract to Ganache
```bash
npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network ganache
```
Copy the deployed contract address for use in the backend `.env`.

### 6. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file:
```
PORT=5000
GANACHE_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=<deployed-contract-address>
PRIVATE_KEY=<ganache-deployer-private-key>
```

Run the backend:
```bash
npm run dev
```

### 7. Set up the frontend
```bash
cd frontend
npm install
npm start
```

---

## 🧪 Testing

Smart contract test coverage includes:
- ✅ Successful certificate issuance
- ✅ Genuine certificate verification (hash match)
- ❌ Tampered certificate detection (hash mismatch)
- ❌ Duplicate certificate ID rejection
- ❌ Unauthorized issuer rejection

Run tests:
```bash
npx hardhat test
```

---

## 🔄 CI/CD

This project uses **GitHub Actions** to automatically compile and test the smart contract on every push and pull request to `main`. See `.github/workflows/ci.yml`.

---

## 🐳 Docker

*(If containerization is added)*

Run the entire stack — frontend, backend, database, and local blockchain — with a single command:

```bash
docker-compose up
```

---

## ⚠️ Limitations

- Blockchain guarantees a certificate hasn't been altered **after** issuance — it does not verify that the information was truthful **at the time** of issuance. Real-world deployment would require additional safeguards (e.g., multi-officer approval, source-document cross-checks).
- This project uses a local blockchain (Ganache) for development/demo purposes rather than a public/production network.

---

## 📄 License

This project is developed for academic purposes as a final-year project.

---

## 👤 Author

*Add your name and contact/portfolio details here.*
