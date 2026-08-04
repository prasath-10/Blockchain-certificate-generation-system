// ============================================================
// blockchain.js — Blockchain Connection & Contract Setup
// ============================================================
// This file is the single source of truth for everything
// blockchain-related in our backend.  It:
//   1. Connects to the local Ganache blockchain node.
//   2. Creates a "signer" wallet from a private key so the
//      backend can sign and send transactions on-chain.
//   3. Attaches that signer to our deployed smart contract so
//      routes can call contract functions directly.
//
// Think of this like a "database.js" file, but instead of
// connecting to PostgreSQL/MongoDB, we are connecting to an
// Ethereum-compatible blockchain (Ganache in this case).
// ============================================================

// Load environment variables from .env file
// (dotenv reads the .env file and makes values available via process.env)
require("dotenv").config();

// ethers.js is the main library we use to talk to Ethereum/EVM blockchains.
// It provides: providers (read-only chain access), signers (authenticated
// transaction sending), and contract wrappers (calling Solidity functions).
const { ethers } = require("ethers");

// Load the ABI (Application Binary Interface) of our smart contract.
// The ABI is a JSON array that describes every function and event the
// contract exposes — ethers.js needs it to know how to encode/decode calls.
// We extracted this from the Hardhat artifacts (artifacts/contracts/...) and
// copied it into backend/contractABI.json for easy access.
const contractABI = require("./contractABI.json");

// ---------------------------------------------------------------
// Step 1: Create a Provider — our READ connection to Ganache
// ---------------------------------------------------------------
// A "provider" is a read-only connection to an Ethereum node.
// JsonRpcProvider connects to any EVM node via its HTTP JSON-RPC URL.
// Ganache runs locally at http://127.0.0.1:7545 by default.
//
// Why from .env?  So we can easily swap Ganache for a testnet
// (e.g., Sepolia) or mainnet just by changing an environment variable
// without touching any source code.
const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL);

// ---------------------------------------------------------------
// Step 2: Create a Wallet (Signer) — our WRITE identity
// ---------------------------------------------------------------
// A "signer" is a wallet that can cryptographically sign transactions.
// We create it from a private key so the backend can send transactions
// (like calling issueCertificate) AS that account.
//
// SECURITY NOTE: The private key is stored in the .env file and NEVER
// hardcoded in source code.  The .env file should be in .gitignore so
// it is never committed to version control.
//
// In Ganache, copy any account's private key from the Ganache UI
// (click the key icon next to an account) and paste it into .env.
// That account must be the one that deployed the contract (the admin)
// OR must have been granted "authorizedIssuer" status by the admin.
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// ---------------------------------------------------------------
// Step 3: Create the Contract Instance
// ---------------------------------------------------------------
// ethers.Contract connects a deployed contract address + ABI + signer
// into a single JavaScript object whose methods map 1-to-1 with the
// Solidity functions defined in CertificateRegistry.sol.
//
// After this, calling:
//   contract.issueCertificate(certId, hash)
// will:
//   a) ABI-encode the arguments
//   b) Sign the transaction with our wallet
//   c) Send it to Ganache via the provider
//   d) Return a TransactionResponse we can .wait() on
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS, // The address where the contract was deployed
  contractABI,                  // The ABI tells ethers what functions exist
  wallet                        // The wallet signs every transaction we send
);

// ---------------------------------------------------------------
// Export the contract instance (and helpers if needed later)
// ---------------------------------------------------------------
// Routes import { contract } from "./blockchain.js" and call
// contract functions directly without worrying about setup details.
module.exports = { contract, provider, wallet };
