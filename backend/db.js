// ============================================================
// MongoDB Connection Configuration (backend/db.js)
// ============================================================
// This file handles establishing and monitoring the connection to 
// our MongoDB database using Mongoose.
// ============================================================

const mongoose = require("mongoose");
const dns = require("dns");

// Fix for Windows / Node.js querySrv ECONNREFUSED issue when resolving MongoDB Atlas SRV records.
// Explicitly configures Node's DNS resolver to use Google (8.8.8.8) and Cloudflare (1.1.1.1) DNS.
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("Notice: Could not override default DNS servers:", dnsErr.message);
}

/**
 * Connects Express backend server to MongoDB database using MONGODB_URI.
 * MONGODB_URI is loaded from the backend/.env environment file.
 */
const connectDB = async () => {
  try {
    // Read connection string from environment variables (.env)
    const connString = process.env.MONGODB_URI;

    if (!connString) {
      console.error(
        "❌ MONGODB_URI is not defined in backend/.env file!\n" +
        "   Please add MONGODB_URI=mongodb://127.0.0.1:27017/certificateDB to your .env file."
      );
      process.exit(1);
    }


    // Attempt to connect to MongoDB using Mongoose
    // Mongoose 6+ has sensible default options enabled automatically.
    const conn = await mongoose.connect(connString);

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} / DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failure: ${error.message}`);
    // Optional: Keep server running or exit process if DB is mandatory.
    // For local dev, we log clear instructions.
  }
};

// ============================================================
// Database Event Listeners (For logging connection lifecycle)
// ============================================================

// Fired when successfully connected to the database
mongoose.connection.on("connected", () => {
  console.log("ℹ️  Mongoose event: Connection opened to MongoDB.");
});

// Fired if an error occurs after the initial connection has been established
mongoose.connection.on("error", (err) => {
  console.error(`❌ Mongoose event: Connection error: ${err}`);
});

// Fired when the connection is disconnected
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  Mongoose event: Connection lost / disconnected from MongoDB.");
});

module.exports = connectDB;
