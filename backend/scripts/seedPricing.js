const mongoose = require("mongoose");
const Service = require("../models/Service");
const { pricingConfig } = require("../config/pricing");
require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.NODE_ENV === "production"
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const seedPricing = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding pricing configuration...");

    // Seed main services
    for (const [serviceName, serviceConfig] of Object.entries(
      pricingConfig.services
    )) {
      const existingService = await Service.findOne({ name: serviceName });

      if (existingService) {
        console.log(`✅ Service "${serviceName}" already exists, updating...`);
        existingService.basePrice = serviceConfig.basePrice;
        existingService.duration = serviceConfig.duration;
        existingService.category = serviceConfig.category;
        existingService.description = serviceConfig.description;
        existingService.features = serviceConfig.features;
        existingService.vehicleTypePricing = serviceConfig.vehicleTypePricing;
        existingService.isActive = true;
        await existingService.save();
      } else {
        console.log(`➕ Creating service "${serviceName}"...`);
        const newService = new Service({
          name: serviceName,
          basePrice: serviceConfig.basePrice,
          duration: serviceConfig.duration,
          category: serviceConfig.category,
          description: serviceConfig.description,
          features: serviceConfig.features,
          vehicleTypePricing: serviceConfig.vehicleTypePricing,
          isActive: true,
        });
        await newService.save();
      }
    }

    // Seed addon services
    for (const [addonName, addonConfig] of Object.entries(
      pricingConfig.addons
    )) {
      const existingAddon = await Service.findOne({ name: addonName });

      if (existingAddon) {
        console.log(`✅ Addon "${addonName}" already exists, updating...`);
        existingAddon.basePrice = addonConfig.basePrice;
        existingAddon.duration = addonConfig.duration;
        existingAddon.category = addonConfig.category;
        existingAddon.description = addonConfig.description;
        existingAddon.canCombineWith = addonConfig.canCombineWith;
        existingAddon.isActive = true;
        await existingAddon.save();
      } else {
        console.log(`➕ Creating addon "${addonName}"...`);
        const newAddon = new Service({
          name: addonName,
          basePrice: addonConfig.basePrice,
          duration: addonConfig.duration,
          category: addonConfig.category,
          description: addonConfig.description,
          canCombineWith: addonConfig.canCombineWith,
          isActive: true,
        });
        await newAddon.save();
      }
    }

    console.log("✅ Pricing configuration seeded successfully!");

    // Display current services
    const allServices = await Service.find({ isActive: true }).sort({
      category: 1,
      name: 1,
    });
    console.log("\n📋 Current Services:");
    allServices.forEach((service) => {
      console.log(
        `  - ${service.name}: $${service.basePrice} (${service.duration}min)`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding pricing:", error);
    process.exit(1);
  }
};

seedPricing();
