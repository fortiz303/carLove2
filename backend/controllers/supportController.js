const SupportTicket = require("../models/SupportTicket");
const {
  sendSupportTicketConfirmation,
  sendSupportTicketResponse,
} = require("../utils/emailService");

// @desc    Create support ticket
// @route   POST /api/support/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, booking } = req.body;

    const ticket = new SupportTicket({
      user: req.user.id,
      subject,
      description,
      category,
      priority,
      booking,
    });

    await ticket.save();

    // Populate for email
    await ticket.populate("user", "email fullName");

    // Send confirmation email
    try {
      await sendSupportTicketConfirmation(ticket);
    } catch (emailError) {
      console.error(
        "Failed to send support ticket confirmation email:",
        emailError
      );
    }

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Create support ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user tickets
// @route   GET /api/support/tickets
// @access  Private
const getUserTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .populate("booking", "scheduledDate vehicle")
      .populate("assignedTo", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/support/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "fullName email")
      .populate("booking", "scheduledDate vehicle")
      .populate("assignedTo", "fullName")
      .populate("messages.author", "fullName role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if user owns the ticket or is admin/staff
    if (
      ticket.user._id.toString() !== req.user.id &&
      req.user.role === "user"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add response to ticket
// @route   POST /api/support/tickets/:id/respond
// @access  Private
const respondToTicket = async (req, res) => {
  try {
    const { content, isInternal } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if user owns the ticket or is admin/staff
    if (ticket.user.toString() !== req.user.id && req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only staff can add internal notes
    if (isInternal && req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Only staff can add internal notes",
      });
    }

    await ticket.addMessage(req.user.id, content, isInternal || false);

    // Populate for email
    await ticket.populate("user", "email fullName");

    // Send email notification if response is from staff
    if (!isInternal && req.user.role !== "user") {
      try {
        const response = { content };
        await sendSupportTicketResponse(ticket, response);
      } catch (emailError) {
        console.error(
          "Failed to send support ticket response email:",
          emailError
        );
      }
    }

    res.json({
      success: true,
      message: "Response added successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Respond to ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Close ticket
// @route   POST /api/support/tickets/:id/close
// @access  Private
const closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if user owns the ticket or is admin/staff
    if (ticket.user.toString() !== req.user.id && req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await ticket.close();

    res.json({
      success: true,
      message: "Ticket closed successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Close ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add satisfaction rating
// @route   POST /api/support/tickets/:id/satisfaction
// @access  Private
const addSatisfaction = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if ticket is resolved or closed
    if (!["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only rate resolved or closed tickets",
      });
    }

    // Check if already rated
    if (ticket.satisfaction) {
      return res.status(400).json({
        success: false,
        message: "Ticket already rated",
      });
    }

    await ticket.addSatisfaction(rating, feedback);

    res.json({
      success: true,
      message: "Satisfaction rating added successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Add satisfaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all tickets (Admin/Staff)
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getAllTickets = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate("user", "fullName email")
      .populate("booking", "scheduledDate vehicle")
      .populate("assignedTo", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Assign ticket to staff
// @route   PUT /api/support/admin/tickets/:id/assign
// @access  Private/Admin
const assignTicket = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.assignedTo = assignedTo;
    await ticket.save();

    res.json({
      success: true,
      message: "Ticket assigned successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Resolve ticket (Admin/Staff)
// @route   POST /api/support/admin/tickets/:id/resolve
// @access  Private/Admin
const resolveTicket = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { resolution } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await ticket.resolve(req.user.id, resolution);

    res.json({
      success: true,
      message: "Ticket resolved successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Resolve ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Escalate ticket (Admin/Staff)
// @route   POST /api/support/admin/tickets/:id/escalate
// @access  Private/Admin
const escalateTicket = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { escalatedTo, reason } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await ticket.escalate(escalatedTo, reason);

    res.json({
      success: true,
      message: "Ticket escalated successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Escalate ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get support statistics (Admin)
// @route   GET /api/support/admin/stats
// @access  Private/Admin
const getSupportStats = async (req, res) => {
  try {
    if (req.user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get ticket counts by status
    const statusStats = await SupportTicket.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get ticket counts by priority
    const priorityStats = await SupportTicket.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Get ticket counts by category
    const categoryStats = await SupportTicket.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get average satisfaction rating
    const satisfactionStats = await SupportTicket.aggregate([
      { $match: { ...dateFilter, satisfaction: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$satisfaction" },
          totalRated: { $sum: 1 },
        },
      },
    ]);

    // Get overdue tickets
    const overdueTickets = await SupportTicket.countDocuments({
      ...dateFilter,
      status: { $nin: ["resolved", "closed"] },
      "sla.isOverdue": true,
    });

    const stats = {
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      satisfaction: {
        averageRating: satisfactionStats[0]?.avgRating || 0,
        totalRated: satisfactionStats[0]?.totalRated || 0,
      },
      overdueTickets,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get support stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createTicket,
  getUserTickets,
  getTicket,
  respondToTicket,
  closeTicket,
  addSatisfaction,
  getAllTickets,
  assignTicket,
  resolveTicket,
  escalateTicket,
  getSupportStats,
};
