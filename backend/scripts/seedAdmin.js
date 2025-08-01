const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      phone: "+1234567890",
      role: "admin",
      isActive: true,
    });

    await adminUser.save();
    console.log("Admin user created successfully:", adminUser.email);
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
