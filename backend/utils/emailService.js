// const nodemailer = require("nodemailer");

// // Create transporter
// const createTransporter = () => {
//   return nodemailer.createTransporter({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
// };

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: "Welcome to Car Detailing Pro!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Car Detailing Pro!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for joining Car Detailing Pro! We're excited to help keep your vehicle looking its best.</p>
        <p>Here's what you can do with your account:</p>
        <ul>
          <li>Book car detailing services</li>
          <li>Manage your appointments</li>
          <li>Track service history</li>
          <li>Get exclusive offers</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  bookingConfirmation: (booking) => ({
    subject: "Booking Confirmation - Car Detailing Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmation</h2>
        <p>Your car detailing appointment has been confirmed!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${
      booking.address.city
    }, ${booking.address.state} ${booking.address.zipCode}</p>
        </div>
        
        <p>We'll send you a reminder 24 hours before your appointment.</p>
        <p>If you need to make any changes, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  bookingReminder: (booking) => ({
    subject: "Reminder: Your Car Detailing Appointment Tomorrow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Appointment Reminder</h2>
        <p>This is a friendly reminder about your car detailing appointment tomorrow.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${
      booking.address.city
    }, ${booking.address.state} ${booking.address.zipCode}</p>
        </div>
        
        <p><strong>Please ensure:</strong></p>
        <ul>
          <li>Your vehicle is accessible at the scheduled time</li>
          <li>Remove any personal items from your vehicle</li>
          <li>Have your payment method ready</li>
        </ul>
        
        <p>If you need to reschedule or cancel, please contact us immediately.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  bookingCancelled: (booking) => ({
    subject: "Booking Cancellation Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Cancellation</h2>
        <p>Your car detailing appointment has been cancelled.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Cancelled Appointment:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Refund Amount:</strong> $${booking.totalAmount}</p>
        </div>
        
        <p>If you have any questions about the cancellation or refund, please contact our support team.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  adminCancellationWithReschedule: (booking) => ({
    subject: "Booking Cancelled - Reschedule Option Available",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Cancelled</h2>
        <p>We regret to inform you that your car detailing appointment has been cancelled by our team.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Cancelled Appointment:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Reason:</strong> ${booking.cancellationReason}</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745;">Would you like to reschedule?</h3>
          <p>We understand this may be inconvenient and would be happy to help you find a new appointment time.</p>
          <p>You can easily reschedule your appointment by logging into your account and selecting a new date and time.</p>
          <a href="${process.env.FRONTEND_URL}/bookings" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Reschedule Now
          </a>
        </div>
        
        <p>Alternatively, if you prefer to cancel completely, you will receive a full refund.</p>
        
        <p>We apologize for any inconvenience and appreciate your understanding.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  bookingRescheduled: (booking) => ({
    subject: "Booking Reschedule Request Received - Pending Approval",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reschedule Request Received</h2>
        <p>Your reschedule request has been received and is <strong>pending admin approval</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Requested Appointment Details:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${
      booking.address.city
    }, ${booking.address.state} ${booking.address.zipCode}</p>
        </div>
        
        <p>We will notify you once your new appointment is confirmed by our team.</p>
        <p>If you need to make any changes, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  bookingCompletion: (booking) => ({
    subject: "Service Completed - Car Detailing Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Service Completed!</h2>
        <p>Great news! Your car detailing service has been completed successfully.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Service Details:</h3>
          <p><strong>Date:</strong> ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
          <p><strong>Services:</strong> ${booking.services
            .map((s) => s.service.name)
            .join(", ")}</p>
          <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
          <p><strong>Address:</strong> ${booking.address.street}, ${
      booking.address.city
    }, ${booking.address.state} ${booking.address.zipCode}</p>
        </div>
        
        ${
          booking.completionNotes
            ? `
        <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Completion Notes:</h3>
          <p>${booking.completionNotes}</p>
        </div>
        `
            : ""
        }
        
        <p>Thank you for choosing Car Detailing Pro! We hope you're satisfied with our service.</p>
        <p>Feel free to leave a review and let us know how we did.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  passwordReset: (resetToken) => ({
    subject: "Password Reset Request - Car Detailing Pro",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Car Detailing Pro account.</p>
        
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Team</p>
      </div>
    `,
  }),

  supportTicketCreated: (ticket) => ({
    subject: `Support Ticket Created - #${ticket._id.toString().slice(-6)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Ticket Created</h2>
        <p>Thank you for contacting our support team. We've received your request and will get back to you soon.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket._id.toString().slice(-6)}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
        </div>
        
        <p>We typically respond within 24 hours. You'll receive an email notification when we reply.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Support Team</p>
      </div>
    `,
  }),

  supportTicketResponse: (ticket, response) => ({
    subject: `Response to Support Ticket #${ticket._id.toString().slice(-6)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Ticket Response</h2>
        <p>We've responded to your support ticket.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket._id.toString().slice(-6)}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
        </div>
        
        <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Response:</h3>
          <p>${response.content}</p>
        </div>
        
        <p>If you have any additional questions, please reply to this email or create a new support ticket.</p>
        
        <p>Best regards,<br>The Car Detailing Pro Support Team</p>
      </div>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  console.log(`📧 [MOCK EMAIL] Would send '${template}' email to:`, to, data);
  return Promise.resolve({ mock: true, to, template, data });
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  console.log(`[MOCK EMAIL] Would send welcome email to:`, user.email);
  return Promise.resolve({ mock: true, type: "welcome", user });
};

// Send booking confirmation
const sendBookingConfirmation = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send booking confirmation to:`,
    booking.user?.email
  );
  return Promise.resolve({ mock: true, type: "bookingConfirmation", booking });
};

// Send booking reminder
const sendBookingReminder = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send booking reminder to:`,
    booking.user?.email
  );
  return Promise.resolve({ mock: true, type: "bookingReminder", booking });
};

// Send booking cancellation
const sendBookingCancellation = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send booking cancellation to:`,
    booking.user?.email
  );
  return Promise.resolve({ mock: true, type: "bookingCancelled", booking });
};

// Send admin cancellation with reschedule offer
const sendAdminCancellationWithReschedule = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send admin cancellation with reschedule offer to:`,
    booking.user?.email
  );
  return Promise.resolve({
    mock: true,
    type: "adminCancellationWithReschedule",
    booking,
  });
};

// Send booking rescheduled confirmation
const sendBookingRescheduled = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send booking rescheduled confirmation to:`,
    booking.user?.email
  );
  return Promise.resolve({ mock: true, type: "bookingRescheduled", booking });
};

// Send booking completion
const sendBookingCompletion = async (booking) => {
  console.log(
    `[MOCK EMAIL] Would send booking completion to:`,
    booking.user?.email
  );
  return Promise.resolve({ mock: true, type: "bookingCompletion", booking });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  console.log(`[MOCK EMAIL] Would send password reset to:`, email);
  return Promise.resolve({
    mock: true,
    type: "passwordReset",
    email,
    resetToken,
  });
};

// Send support ticket confirmation
const sendSupportTicketConfirmation = async (ticket) => {
  console.log(
    `[MOCK EMAIL] Would send support ticket confirmation to:`,
    ticket.user?.email
  );
  return Promise.resolve({ mock: true, type: "supportTicketCreated", ticket });
};

// Send support ticket response
const sendSupportTicketResponse = async (ticket, response) => {
  console.log(
    `[MOCK EMAIL] Would send support ticket response to:`,
    ticket.user?.email
  );
  return Promise.resolve({
    mock: true,
    type: "supportTicketResponse",
    ticket,
    response,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation,
  sendAdminCancellationWithReschedule,
  sendBookingRescheduled,
  sendBookingCompletion,
  sendPasswordResetEmail,
  sendSupportTicketConfirmation,
  sendSupportTicketResponse,
};
