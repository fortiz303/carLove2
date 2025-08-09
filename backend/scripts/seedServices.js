const mongoose = require("mongoose");
const Service = require("../models/Service");
require("dotenv").config();

const services = [
  {
    name: "Interior Only",
    description: "Deep Clean Seats, Carpets, Panels, And More.",
    category: "interior",
    basePrice: 30,
    duration: 120, // 2 hours
    isActive: true,
    image: "/images/image1.png",
    features: [
      "Vacuum and steam clean seats",
      "Clean and condition leather/vinyl",
      "Detail dashboard and console",
      "Clean door panels and handles",
      "Vacuum and clean carpets",
      "Clean windows and mirrors",
      "Deodorize interior",
      "Air vent cleaning",
    ],
    requirements: [
      "Remove personal items from vehicle",
      "Provide access to vehicle",
    ],
  },
  {
    name: "Exterior Only",
    description: "Wash, Polish, And Protect Your Car's Exterior.",
    category: "exterior",
    basePrice: 20,
    duration: 90, // 1.5 hours
    isActive: true,
    image: "/images/image2.png",
    features: [
      "Hand wash",
      "Clay bar treatment",
      "Wax application",
      "Tire and wheel cleaning",
      "Window cleaning",
      "Paint protection",
    ],
    requirements: [
      "Vehicle should be in accessible location",
      "Clear weather conditions preferred",
    ],
  },
  {
    name: "Full Detail",
    description: "Complete Interior And Exterior Service.",
    category: "full",
    basePrice: 80,
    duration: 240, // 4 hours
    isActive: true,
    image: "/images/image3.png",
    features: [
      "Complete interior cleaning",
      "Complete exterior cleaning",
      "Engine bay cleaning",
      "Undercarriage cleaning",
      "Paint correction",
      "Ceramic coating application",
    ],
    requirements: [
      "Remove all personal items",
      "Provide access to vehicle",
      "Clear weather conditions preferred",
    ],
  },
];

async function seedServices() {
  try {
    console.log("Starting service seeding...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing services
    await Service.deleteMany({});
    console.log("Cleared existing services");

    // Insert new services
    const createdServices = await Service.insertMany(services);
    console.log(`Created ${createdServices.length} services:`);

    createdServices.forEach((service) => {
      console.log(`- ${service.name} (ID: ${service._id})`);
    });

    console.log("Services seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  }
}

seedServices();
