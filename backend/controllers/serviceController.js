const Service = require("../models/Service");

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getAllServices = async (req, res) => {
  try {
    const { category, vehicleType, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .sort({ popularity: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate prices for specific vehicle type if provided
    if (vehicleType) {
      services.forEach((service) => {
        service.calculatedPrice = service.getSeasonalPrice(vehicleType);
      });
    }

    const total = await Service.countDocuments(query);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all services error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const { vehicleType } = req.query;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not available",
      });
    }

    // Calculate price for specific vehicle type if provided
    if (vehicleType) {
      service.calculatedPrice = service.getSeasonalPrice(vehicleType);
    }

    res.json({
      success: true,
      data: { service },
    });
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { vehicleType } = req.query;

    const services = await Service.getActiveByCategory(category);

    // Calculate prices for specific vehicle type if provided
    if (vehicleType) {
      services.forEach((service) => {
        service.calculatedPrice = service.getSeasonalPrice(vehicleType);
      });
    }

    res.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error("Get services by category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
const getPopularServices = async (req, res) => {
  try {
    const { limit = 10, vehicleType } = req.query;

    const services = await Service.getPopular(parseInt(limit));

    // Calculate prices for specific vehicle type if provided
    if (vehicleType) {
      services.forEach((service) => {
        service.calculatedPrice = service.getSeasonalPrice(vehicleType);
      });
    }

    res.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error("Get popular services error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Calculate service price
// @route   POST /api/services/calculate-price
// @access  Public
const calculatePrice = async (req, res) => {
  try {
    const { serviceId, vehicleType, quantity = 1 } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const basePrice = service.getSeasonalPrice(vehicleType || "sedan");
    const totalPrice = basePrice * quantity;

    res.json({
      success: true,
      data: {
        serviceId,
        vehicleType: vehicleType || "sedan",
        quantity,
        basePrice,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Calculate price error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create service (Admin)
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      duration,
      features,
      requirements,
      vehicleTypePricing,
      image,
    } = req.body;

    const service = new Service({
      name,
      description,
      category,
      basePrice,
      duration,
      features,
      requirements,
      vehicleTypePricing,
      image,
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update service (Admin)
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const updateFields = req.body;
    Object.keys(updateFields).forEach((key) => {
      service[key] = updateFields[key];
    });

    await service.save();

    res.json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete service (Admin)
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Soft delete - mark as inactive
    service.isActive = false;
    await service.save();

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get service statistics (Admin)
// @route   GET /api/services/admin/stats
// @access  Private/Admin
const getServiceStats = async (req, res) => {
  try {
    // Get service counts by category
    const categoryStats = await Service.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get average ratings
    const ratingStats = await Service.aggregate([
      { $match: { isActive: true, averageRating: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$averageRating" },
          totalRated: { $sum: 1 },
        },
      },
    ]);

    // Get most popular services
    const popularServices = await Service.find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(5)
      .select("name category popularity averageRating");

    const stats = {
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      ratings: {
        averageRating: ratingStats[0]?.avgRating || 0,
        totalRated: ratingStats[0]?.totalRated || 0,
      },
      popularServices,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get service stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create default services if they don't exist
// @route   POST /api/services/seed
// @access  Private (Admin only)
const seedDefaultServices = async (req, res) => {
  try {
    const defaultServices = [
      {
        name: "Interior Only",
        description: "Deep Clean Seats, Carpets, Panels, And More.",
        category: "interior",
        basePrice: 60,
        duration: 120,
        isActive: true,
        image: "/images/image1.png",
        features: [
          "Deep seat cleaning",
          "Carpet and floor mat cleaning",
          "Dashboard and console cleaning",
          "Door panel cleaning",
          "Window cleaning",
          "Air vent cleaning",
        ],
        requirements: [
          "Remove personal items from vehicle",
          "Provide access to vehicle",
        ],
        vehicleTypePricing: {
          sedan: 0,
          suv: 20,
          truck: 30,
          luxury: 40,
        },
      },
      {
        name: "Exterior Only",
        description: "Wash, Polish, And Protect Your Car's Exterior.",
        category: "exterior",
        basePrice: 50,
        duration: 90,
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
        vehicleTypePricing: {
          sedan: 0,
          suv: 15,
          truck: 25,
          luxury: 35,
        },
      },
      {
        name: "Full Detail",
        description: "Complete Interior And Exterior Service.",
        category: "full",
        basePrice: 100,
        duration: 240,
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
        vehicleTypePricing: {
          sedan: 0,
          suv: 35,
          truck: 50,
          luxury: 75,
        },
      },
    ];

    const createdServices = [];

    for (const serviceData of defaultServices) {
      // Check if service already exists
      let service = await Service.findOne({ name: serviceData.name });

      if (!service) {
        service = new Service(serviceData);
        await service.save();
        createdServices.push(service);
      }
    }

    res.json({
      success: true,
      message: `Created ${createdServices.length} new services`,
      data: { services: createdServices },
    });
  } catch (error) {
    console.error("Seed services error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAllServices,
  getService,
  getServicesByCategory,
  getPopularServices,
  calculatePrice,
  createService,
  updateService,
  deleteService,
  getServiceStats,
  seedDefaultServices,
};
