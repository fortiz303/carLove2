# Car Detailing Booking API

A complete Express.js + MongoDB backend for a car detailing booking application with authentication, booking management, payment processing, and support ticket system.

## Features

### 🔐 Authentication

- JWT-based authentication
- Email/password registration and login
- Social login support (Google, Facebook, Apple) - placeholders included
- Password reset functionality
- Account lockout protection

### 🚗 Booking System

- Create and manage car detailing appointments
- Multiple service types (Interior, Exterior, Full Detail, Add-ons)
- Vehicle type-specific pricing
- Date and time slot selection
- Recurring booking options (weekly, bi-weekly, monthly)
- Booking status tracking (Pending, Confirmed, In-Progress, Completed, Cancelled)

### 💳 Payment Integration

- Stripe payment processing
- Payment intent creation
- Webhook handling for payment confirmation
- Refund processing
- Payment method management

### 👤 User Management

- User profile management
- Multiple saved addresses
- Notification preferences
- Account statistics

### 🎫 Support System

- Create and manage support tickets
- Ticket categorization and priority levels
- Internal notes for staff
- SLA tracking
- Customer satisfaction ratings

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js
- **Payment**: Stripe
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Project Structure

```
car-detailing-backend/
├── config/
│   ├── database.js      # MongoDB connection
│   ├── passport.js      # OAuth strategies
│   └── stripe.js        # Stripe configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── bookingController.js # Booking operations
│   ├── paymentController.js # Payment processing
│   ├── supportController.js # Support tickets
│   └── serviceController.js # Service management
├── middleware/
│   ├── auth.js         # JWT authentication
│   └── validation.js   # Request validation
├── models/
│   ├── User.js         # User schema
│   ├── Service.js      # Service schema
│   ├── Booking.js      # Booking schema
│   └── SupportTicket.js # Support ticket schema
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── user.js         # User routes
│   ├── booking.js      # Booking routes
│   ├── payment.js      # Payment routes
│   ├── support.js      # Support routes
│   └── service.js      # Service routes
├── utils/
│   └── emailService.js # Email templates and sending
├── server.js           # Main application file
├── package.json        # Dependencies
├── env.example         # Environment variables template
└── README.md          # This file
```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd car-detailing-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/car-detailing-app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # OAuth Configuration (placeholders)
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_app_password

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### OAuth (Placeholders)

- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/apple` - Apple OAuth

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/preferences` - Update preferences
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/addresses` - Get saved addresses
- `POST /api/user/addresses` - Add new address
- `PUT /api/user/addresses/:id` - Update address
- `DELETE /api/user/addresses/:id` - Delete address

### Services

- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/category/:category` - Get services by category
- `GET /api/services/popular` - Get popular services
- `POST /api/services/calculate-price` - Calculate service price

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/review` - Add review
- `GET /api/bookings/available-slots` - Get available time slots

### Payments

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook
- `GET /api/payments/methods` - Get payment methods
- `POST /api/payments/methods` - Add payment method
- `DELETE /api/payments/methods/:id` - Remove payment method

### Support

- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get user tickets
- `GET /api/support/tickets/:id` - Get ticket by ID
- `POST /api/support/tickets/:id/respond` - Respond to ticket
- `POST /api/support/tickets/:id/close` - Close ticket
- `POST /api/support/tickets/:id/satisfaction` - Add satisfaction rating

## Environment Variables

| Variable                | Description               | Required                  |
| ----------------------- | ------------------------- | ------------------------- |
| `PORT`                  | Server port               | No (default: 5000)        |
| `NODE_ENV`              | Environment               | No (default: development) |
| `MONGODB_URI`           | MongoDB connection string | Yes                       |
| `JWT_SECRET`            | JWT signing secret        | Yes                       |
| `JWT_EXPIRE`            | JWT expiration time       | No (default: 7d)          |
| `STRIPE_SECRET_KEY`     | Stripe secret key         | Yes                       |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret     | Yes                       |
| `SMTP_HOST`             | SMTP server host          | Yes                       |
| `SMTP_PORT`             | SMTP server port          | Yes                       |
| `SMTP_USER`             | SMTP username             | Yes                       |
| `SMTP_PASS`             | SMTP password             | Yes                       |
| `FRONTEND_URL`          | Frontend URL for CORS     | Yes                       |

## Database Models

### User

- Basic info (name, email, phone)
- Authentication (password, OAuth IDs)
- Addresses (multiple saved addresses)
- Preferences (notifications, marketing)
- Stripe customer ID

### Service

- Service details (name, description, category)
- Pricing (base price, vehicle type surcharges)
- Duration and features
- Seasonal pricing
- Popularity tracking

### Booking

- User and service references
- Scheduling (date, time, duration)
- Vehicle information
- Service location
- Payment status
- Booking status and notes

### SupportTicket

- User and optional booking reference
- Ticket details (subject, description, category)
- Priority and status
- Messages and responses
- SLA tracking
- Satisfaction rating

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- Account lockout protection

## Email Templates

The application includes email templates for:

- Welcome emails
- Booking confirmations
- Booking reminders
- Booking cancellations
- Password reset
- Support ticket confirmations
- Support ticket responses

## Development

### Running in Development

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Code Structure

- Controllers handle business logic
- Models define data structure and methods
- Routes define API endpoints
- Middleware handles authentication and validation
- Utils contain helper functions

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Configure proper CORS origins
4. Set up Stripe webhook endpoints
5. Configure email service
6. Use environment-specific JWT secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please create an issue in the repository or contact the development team.
