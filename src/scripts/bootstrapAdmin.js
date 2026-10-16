require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { connectDB } = require("../config/db");

async function bootstrapAdmin() {
  console.log("🚀 Starting BrainShelf Administrator Bootstrap...");

  const connected = await connectDB();
  if (!connected) {
    console.error("❌ Could not connect to database. Please check MONGODB_URI in .env.");
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || process.argv[2] || "admin@brainshelf.edu").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || "BrainShelfAdmin2026!";
  const name = process.env.ADMIN_NAME || "System Administrator";

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === "admin") {
        console.log(`ℹ️ Admin account with email [${email}] already exists.`);
      } else {
        existing.role = "admin";
        await existing.save();
        console.log(`✅ Promoted existing user [${email}] to Administrator.`);
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await User.hashPassword(password);
    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      semester: "Other",
      college: "BrainShelf Administration",
    });

    console.log(`🎉 Administrator created successfully!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   ID:    ${admin._id}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  bootstrapAdmin();
}

module.exports = bootstrapAdmin;
