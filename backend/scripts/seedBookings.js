const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");
require("dotenv").config();

async function seedBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get a user and service for testing
    const user = await User.findOne({ role: "user" });
    const service = await Service.findOne({ isActive: true });

    if (!user) {
      console.log("No user found. Please create a user first.");
      return;
    }

    if (!service) {
      console.log("No service found. Please seed services first.");
      return;
    }

    // Clear existing bookings
    await Booking.deleteMany({});
    console.log("Cleared existing bookings");

    // Create test bookings
    const testBookings = [
      {
        user: user._id,
        services: [
          {
            service: service._id,
            quantity: 1,
            price: service.basePrice,
          },
        ],
        totalAmount: service.basePrice,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        scheduledTime: "10:00",
        duration: service.duration,
        status: "pending",
        vehicle: {
          make: "Toyota",
          model: "Camry",
          year: 2020,
          color: "Silver",
          type: "sedan",
        },
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "US",
        },
        frequency: "one-time",
        specialInstructions: "Please be careful with the paint",
        payment: {
          paymentStatus: "pending",
        },
      },
      {
        user: user._id,
        services: [
          {
            service: service._id,
            quantity: 1,
            price: service.basePrice,
          },
        ],
        totalAmount: service.basePrice,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        scheduledTime: "14:00",
        duration: service.duration,
        status: "confirmed",
        vehicle: {
          make: "Honda",
          model: "Accord",
          year: 2019,
          color: "Black",
          type: "sedan",
        },
        address: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "US",
        },
        frequency: "one-time",
        payment: {
          paymentStatus: "paid",
          paidAt: new Date(),
        },
      },
      {
        user: user._id,
        services: [
          {
            service: service._id,
            quantity: 1,
            price: service.basePrice,
          },
        ],
        totalAmount: service.basePrice,
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        scheduledTime: "11:00",
        duration: service.duration,
        status: "completed",
        vehicle: {
          make: "Ford",
          model: "Mustang",
          year: 2021,
          color: "Red",
          type: "sedan",
        },
        address: {
          street: "789 Pine St",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US",
        },
        frequency: "one-time",
        payment: {
          paymentStatus: "paid",
          paidAt: new Date(),
        },
        completedAt: new Date(),
      },
    ];

    // Insert test bookings
    const createdBookings = await Booking.insertMany(testBookings);
    console.log(`Created ${createdBookings.length} test bookings`);

    console.log("Booking seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding bookings:", error);
    process.exit(1);
  }
}

seedBookings();
