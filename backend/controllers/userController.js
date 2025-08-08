const User = require("../models/User");

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, dateOfBirth, gender, avatar } = req.body;

    const user = await User.findById(req.user.id);

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { notifications, marketing } = req.body;

    const user = await User.findById(req.user.id);

    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications,
      };
    }

    if (marketing !== undefined) {
      user.preferences.marketing = marketing;
    }

    await user.save();

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: { preferences: user.preferences },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user addresses
// @route   GET /api/user/addresses
// @access  Private
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: { addresses: user.addresses },
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add new address
// @route   POST /api/user/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    const { type, label, street, city, state, zipCode, country, isDefault } =
      req.body;

    const user = await User.findById(req.user.id);

    const addressData = {
      type: type || "home",
      label,
      street,
      city,
      state,
      zipCode,
      country: country || "US",
      isDefault: isDefault || false,
    };

    await user.addAddress(addressData);

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: { addresses: user.addresses },
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update address
// @route   PUT /api/user/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user.id);

    await user.updateAddress(addressId, updateData);

    res.json({
      success: true,
      message: "Address updated successfully",
      data: { addresses: user.addresses },
    });
  } catch (error) {
    console.error("Update address error:", error);
    if (error.message === "Address not found") {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/user/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    await user.deleteAddress(addressId);

    res.json({
      success: true,
      message: "Address deleted successfully",
      data: { addresses: user.addresses },
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get default address
// @route   GET /api/user/addresses/default
// @access  Private
const getDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const defaultAddress = user.getDefaultAddress();

    res.json({
      success: true,
      data: { address: defaultAddress },
    });
  } catch (error) {
    console.error("Get default address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Set default address
// @route   PUT /api/user/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);

    await user.updateAddress(addressId, { isDefault: true });

    res.json({
      success: true,
      message: "Default address updated successfully",
      data: { addresses: user.addresses },
    });
  } catch (error) {
    console.error("Set default address error:", error);
    if (error.message === "Address not found") {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    const SupportTicket = require("../models/SupportTicket");

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ user: req.user.id });
    const completedBookings = await Booking.countDocuments({
      user: req.user.id,
      status: "completed",
    });
    const pendingBookings = await Booking.countDocuments({
      user: req.user.id,
      status: { $in: ["pending", "confirmed"] },
    });

    // Get support ticket statistics
    const totalTickets = await SupportTicket.countDocuments({
      user: req.user.id,
    });
    const openTickets = await SupportTicket.countDocuments({
      user: req.user.id,
      status: { $in: ["open", "in-progress"] },
    });

    // Get total spent
    const totalSpent = await Booking.aggregate([
      { $match: { user: req.user.id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const stats = {
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
      },
      support: {
        total: totalTickets,
        open: openTickets,
      },
      totalSpent: totalSpent[0]?.total || 0,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user vehicles
// @route   GET /api/user/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const vehicles = user.getVehicles();

    res.json({
      success: true,
      data: { vehicles },
    });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add vehicle
// @route   POST /api/user/vehicles
// @access  Private
const addVehicle = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      color,
      type,
      licensePlate,
      vin,
      nickname,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user.id);

    const vehicleData = {
      make,
      model,
      year,
      color,
      type,
      licensePlate,
      vin,
      nickname,
      isDefault: isDefault || false,
    };

    await user.addVehicle(vehicleData);
    const vehicles = user.getVehicles();

    res.json({
      success: true,
      message: "Vehicle added successfully",
      data: { vehicles },
    });
  } catch (error) {
    console.error("Add vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/user/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user.id);
    await user.updateVehicle(id, updateData);
    const vehicles = user.getVehicles();

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: { vehicles },
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    if (error.message === "Vehicle not found") {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/user/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    await user.deleteVehicle(id);
    const vehicles = user.getVehicles();

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
      data: { vehicles },
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Set default vehicle
// @route   PUT /api/user/vehicles/:id/default
// @access  Private
const setDefaultVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    await user.setDefaultVehicle(id);
    const vehicles = user.getVehicles();

    res.json({
      success: true,
      message: "Default vehicle set successfully",
      data: { vehicles },
    });
  } catch (error) {
    console.error("Set default vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get default vehicle
// @route   GET /api/user/vehicles/default
// @access  Private
const getDefaultVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const defaultVehicle = user.getDefaultVehicle();

    res.json({
      success: true,
      data: { vehicle: defaultVehicle },
    });
  } catch (error) {
    console.error("Get default vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get staff members (Admin only)
// @route   GET /api/user/admin/staff
// @access  Private/Admin
const getStaffMembers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const staffMembers = await User.find({ role: "admin" })
      .select("_id fullName email role")
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: { staffMembers },
    });
  } catch (error) {
    console.error("Get staff members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  deleteAccount,
  getUserStats,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
  getDefaultVehicle,
  getStaffMembers,
};
