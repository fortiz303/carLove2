# CARLOVE - Car Detailing Booking Platform

A full-stack web application for booking professional car detailing services at your doorstep. Built with Next.js frontend and Express.js backend, featuring authentication, booking management, payment processing, and support ticket system.

![CARLOVE Logo](https://img.shields.io/badge/CARLOVE-Car%20Detailing%20Platform-green?style=for-the-badge&logo=car)

## 🚗 Features

### 🔐 Authentication & User Management

- JWT-based authentication system
- Email/password registration and login
- Social login support (Google, Facebook, Apple) - placeholders included
- Password reset functionality
- Account lockout protection
- User profile management with multiple saved addresses

### 📅 Booking System

- Create and manage car detailing appointments
- Multiple service types (Interior, Exterior, Full Detail, Add-ons)
- Vehicle type-specific pricing
- Date and time slot selection with availability checking
- Recurring booking options (weekly, bi-weekly, monthly)
- Booking status tracking (Pending, Confirmed, In-Progress, Completed, Cancelled)

### 💳 Payment Integration

- Stripe payment processing
- Payment intent creation and confirmation
- Webhook handling for payment status updates
- Refund processing capabilities
- Payment method management

### 🎫 Support System

- Create and manage support tickets
- Ticket categorization and priority levels
- Internal notes for staff
- SLA tracking
- Customer satisfaction ratings

### 👨‍💼 Admin Dashboard

- User management and statistics
- Booking overview and management
- Support ticket handling
- Service management and pricing

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks
- **Icons**: Lucide React
- **Package Manager**: pnpm

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js
- **Payment**: Stripe integration
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📁 Project Structure

```
cda/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── booking/        # Booking flow pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── login/          # Authentication pages
│   │   ├── profile/        # User profile
│   │   ├── services/       # Service listing
│   │   └── support/        # Support system
│   ├── components/         # Reusable UI components
│   │   └── ui/            # Radix UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── public/            # Static assets
├── backend/                # Express.js backend API
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
└── documentation/         # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Stripe account (for payments)
- SMTP service (for emails)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cda
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Edit .env with your configuration
# See Environment Variables section below

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 4. Environment Variables

#### Backend (.env)

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

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 📚 API Documentation

The backend API is fully documented with examples. See [backend/api.md](backend/api.md) for complete API reference.

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/me` - Get current user

#### Services

- `GET /api/services` - Get all services
- `GET /api/services/popular` - Get popular services
- `POST /api/services/calculate-price` - Calculate service price

#### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings/:id/cancel` - Cancel booking

#### Payments

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

#### Support

- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get user tickets

## 🎨 UI Components

The frontend uses a comprehensive set of UI components built with Radix UI primitives and styled with Tailwind CSS:

- **Forms**: Input, Select, Checkbox, Radio, Textarea
- **Navigation**: Breadcrumb, Navigation Menu, Tabs
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Layout**: Card, Dialog, Sheet, Drawer
- **Data Display**: Table, Calendar, Chart
- **Interactive**: Button, Switch, Slider, Toggle

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
- Input validation and sanitization
- SQL injection protection (MongoDB)

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
pnpm test
```

## 📦 Deployment

### Backend Deployment

1. Set up MongoDB Atlas or self-hosted MongoDB
2. Configure environment variables for production
3. Deploy to your preferred platform (Heroku, Vercel, AWS, etc.)

### Frontend Deployment

1. Build the application: `pnpm build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation in the `documentation/` folder

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with car wash equipment APIs
- [ ] Loyalty program implementation

---

**CARLOVE** - Your Car, Our Care – At Your Doorstep 🚗✨
