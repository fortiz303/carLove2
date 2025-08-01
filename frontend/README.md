# Car Detailing App - Frontend

A modern React/Next.js frontend for a car detailing booking application.

## Features

### Booking Management

- **Real-time Booking List**: View all your bookings with real-time data from the backend
- **Booking Status Tracking**: See the status of each booking (pending, confirmed, in-progress, completed, cancelled)
- **Rebook Functionality**: Easily rebook previous services with pre-filled information
- **Cancel Bookings**: Cancel upcoming bookings (for confirmed bookings only)

### Booking Flow

- **Multi-step Booking Process**: Location → Service → Date/Time → Payment → Confirmation
- **Service Selection**: Choose from available services with pricing
- **Add-on Services**: Customize your booking with additional services
- **Date & Time Selection**: Pick from available time slots
- **Payment Integration**: Secure payment processing

### User Experience

- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Proper loading indicators for better UX
- **Error Handling**: Graceful error handling with user-friendly messages
- **Session Management**: Secure authentication with NextAuth.js

## Integration with Backend

The frontend integrates with the backend API for:

### Bookings

- `GET /api/bookings` - Fetch user's booking history
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get specific booking details
- `POST /api/bookings/:id/cancel` - Cancel a booking
- `PUT /api/bookings/:id` - Update booking details

### Services

- `GET /api/services` - Fetch available services
- `GET /api/services/:id` - Get specific service details

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

## Rebooking Feature

The rebooking feature allows users to:

1. **View Past Bookings**: See completed or cancelled bookings in the "Past" tab
2. **Rebook Services**: Click "Rebook" on any past booking
3. **Pre-filled Information**: The booking form is automatically populated with:
   - Previous service selection
   - Vehicle information
   - Address details
   - Special instructions
4. **Customize**: Users can modify any pre-filled information before confirming

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp env.example .env.local
   ```

3. Configure the backend URL:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `NEXTAUTH_URL`: NextAuth.js URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **State Management**: React hooks
- **HTTP Client**: Fetch API with custom wrapper

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── booking/           # Booking flow pages
│   ├── bookings/          # Booking management
│   ├── dashboard/         # User dashboard
│   └── ...
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                  # Utility libraries
│   ├── api.ts           # API service
│   ├── auth.ts          # Authentication config
│   └── ...
└── types/               # TypeScript type definitions
```
