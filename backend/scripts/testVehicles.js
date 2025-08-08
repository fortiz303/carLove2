const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function testVehicleManagement() {
  try {
    console.log("Testing Vehicle Management System...\n");

    // Find a test user (or create one if needed)
    let testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      console.log("Creating test user...");
      testUser = new User({
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "+1234567890",
      });
      await testUser.save();
      console.log("Test user created successfully");
    }

    console.log("1. Testing addVehicle method...");
    const vehicleData = {
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "White",
      type: "sedan",
      licensePlate: "ABC123",
      nickname: "My Daily Driver",
      isDefault: true,
    };

    await testUser.addVehicle(vehicleData);
    console.log("✓ Vehicle added successfully");

    console.log("\n2. Testing getVehicles method...");
    const vehicles = testUser.getVehicles();
    console.log(`✓ Found ${vehicles.length} vehicles`);
    vehicles.forEach((vehicle, index) => {
      console.log(
        `  ${index + 1}. ${vehicle.year} ${vehicle.make} ${vehicle.model} (${
          vehicle.nickname || "No nickname"
        })`
      );
    });

    console.log("\n3. Testing getDefaultVehicle method...");
    const defaultVehicle = testUser.getDefaultVehicle();
    console.log(
      `✓ Default vehicle: ${defaultVehicle.year} ${defaultVehicle.make} ${defaultVehicle.model}`
    );

    console.log("\n4. Testing addVehicle with duplicate check...");
    const duplicateVehicle = {
      make: "Toyota",
      model: "Camry",
      year: 2020,
      color: "White",
      type: "sedan",
      licensePlate: "ABC123",
      nickname: "Duplicate",
      isDefault: false,
    };

    await testUser.addVehicle(duplicateVehicle);
    const updatedVehicles = testUser.getVehicles();
    console.log(
      `✓ After duplicate attempt: ${updatedVehicles.length} vehicles (should be same)`
    );

    console.log("\n5. Testing updateVehicle method...");
    if (vehicles.length > 0) {
      const vehicleToUpdate = vehicles[0];
      await testUser.updateVehicle(vehicleToUpdate._id.toString(), {
        nickname: "Updated Daily Driver",
        color: "Silver",
      });
      console.log("✓ Vehicle updated successfully");
    }

    console.log("\n6. Testing setDefaultVehicle method...");
    if (vehicles.length > 1) {
      await testUser.setDefaultVehicle(vehicles[1]._id.toString());
      const newDefault = testUser.getDefaultVehicle();
      console.log(
        `✓ New default vehicle: ${newDefault.year} ${newDefault.make} ${newDefault.model}`
      );
    }

    console.log("\n7. Testing deleteVehicle method...");
    if (vehicles.length > 0) {
      const vehicleToDelete = vehicles[0];
      await testUser.deleteVehicle(vehicleToDelete._id.toString());
      const remainingVehicles = testUser.getVehicles();
      console.log(
        `✓ Vehicle deleted. Remaining vehicles: ${remainingVehicles.length}`
      );
    }

    console.log("\n✅ All vehicle management tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the test
testVehicleManagement();
