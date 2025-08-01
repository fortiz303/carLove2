const User = require("../models/User");
const Booking = require("../models/Booking");

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 * @access Private (Admin only)
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments({ role: "user" });

    // Get total bookings count
    const totalBookings = await Booking.countDocuments();

    // Get total revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: "completed",
          "payment.paymentStatus": "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get booking status breakdown
    const bookingStatusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object format
    const statusBreakdown = {};
    bookingStatusBreakdown.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    // Get monthly bookings for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "completed"] },
                    { $eq: ["$payment.paymentStatus", "paid"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format monthly data
    const monthlyData = monthlyBookings.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleString(
        "default",
        { month: "short" }
      ),
      bookings: item.bookings,
      revenue: item.revenue,
    }));

    // Get recent bookings (last 5)
    const recentBookings = await Booking.find()
      .populate("user", "fullName email")
      .populate("services.service", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id totalAmount status scheduledDate scheduledTime");

    const response = {
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalRevenue,
        bookingStatusBreakdown: statusBreakdown,
        monthlyBookings: monthlyData,
        recentBookings: recentBookings.map((booking) => ({
          id: booking._id,
          customer: booking.user?.fullName || "Unknown",
          service: booking.services[0]?.service?.name || "Multiple Services",
          date: booking.scheduledDate,
          status: booking.status,
          amount: booking.totalAmount,
        })),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
