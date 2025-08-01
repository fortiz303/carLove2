# 🚗 Car Detailing App – Booking & Cancellation Flow

This document outlines the complete booking and cancellation flow implemented in the Car Detailing App.

## 📋 Overview

The booking system follows a comprehensive flow that handles user requests, admin review, confirmations, cancellations, and rescheduling with proper notifications and refund processing.

## 🔄 Complete Flow

### 1. User Requests Booking

**Process:**

- User selects service(s), date/time, location, and enters payment info
- Booking is created with status: `pending`
- Payment is held (authorized, not captured)
- Admin is notified via email
- User receives confirmation email

**API Endpoint:** `POST /api/bookings`

**Status:** `pending`

### 2. Admin Reviews Booking

**Admin Dashboard Features:**

- View all pending bookings with customer details
- Accept bookings (status becomes `confirmed`)
- Reject bookings (status becomes `cancelled`)
- Cancel confirmed bookings with reschedule offer

**Admin Actions:**

- ✅ **Accept Booking:** `POST /api/bookings/admin/:id/accept`
- ❌ **Reject Booking:** `POST /api/bookings/admin/:id/reject`
- 🚫 **Cancel Booking:** `POST /api/bookings/admin/:id/cancel`
- ✅ **Complete Booking:** `POST /api/bookings/admin/:id/complete`

### 3. User Receives Booking Confirmation

**When Admin Accepts:**

- User receives confirmation email
- Status: `confirmed`
- Payment is captured
- Booking is locked in

**When Admin Completes:**

- User receives completion email with optional notes
- Status: `completed`
- Completion timestamp recorded
- User can leave review

**When Admin Rejects:**

- User receives cancellation email
- Full refund processed (if payment was made)
- Status: `cancelled`

### 4. User Cancels Booking

**Cancellation Rules:**

- **Pending Bookings:** ✅ Can be cancelled anytime before admin confirmation
- **Confirmed Bookings:** If cancelled before cutoff (24 hours prior): ✅ Full refund
- **Confirmed Bookings:** If cancelled after cutoff: ⚠️ Partial or no refund (depends on policy)
- Status: `cancelled by user`
- **Reason Required:** User must select a cancellation reason
- **Payment Handling:** If payment was already processed, automatic refund is issued

**Cancellation Reasons (User):**

- Schedule Conflict
- Vehicle Unavailable
- Financial Reasons
- Found Other Service
- Personal Emergency
- Weather Conditions
- Other (with custom reason)

**API Endpoint:** `POST /api/bookings/:id/cancel`

### 4.5. User Cancels Pending Booking

**Process:**

- User can cancel pending bookings anytime before admin review
- No payment processing has occurred yet
- Immediate cancellation with reason
- Admin is notified of the cancellation
- User receives cancellation confirmation

**UI Features:**

- Cancel button visible on pending bookings
- "Awaiting Confirmation" notice with cancellation option
- Cancellation reason dialog required
- Immediate status update to "cancelled"

### 5. Admin Cancels Booking

**Process:**

- User is notified immediately via email
- Admin can offer rescheduling option
- User sees two options:
  - **Rebook** (pick a new date/time)
  - **Cancel & get full refund**
- **Reason Required:** Admin must select a cancellation reason

**Cancellation Reasons (Admin):**

- Staff Unavailable
- Equipment Issues
- Weather Conditions
- Location Inaccessible
- Safety Concerns
- Service Not Available
- Customer Request
- Other (with custom reason)

**Status:** `cancelled by admin`

## 🎯 Key Features

### Admin Booking Management

**Dashboard Features:**

- Real-time booking statistics
- Filter by status (pending, confirmed, in-progress, completed, cancelled)
- Search by customer name, email, or vehicle
- Bulk actions for multiple bookings

**Admin Actions:**

```typescript
// Accept a pending booking
await apiService.acceptBooking(bookingId, token, assignedStaff?, notes?)

// Reject a pending booking
await apiService.rejectBooking(bookingId, reason, token, refundAmount?)

// Cancel a confirmed booking
await apiService.adminCancelBooking(bookingId, reason, offerReschedule, token, refundAmount?)
```

### Rescheduling System

**When Admin Cancels with Reschedule Offer:**

1. User receives email with reschedule option
2. User can select new date/time from available slots
3. Booking is automatically rescheduled
4. User receives confirmation email

**Reschedule Flow:**

```typescript
// Get available time slots
await apiService.getRescheduleSlots(bookingId, date, duration, token);

// Reschedule booking
await apiService.rescheduleBooking(bookingId, newDate, newTime, token);
```

### Email Notifications

**Email Templates:**

- `bookingConfirmation`: When booking is accepted
- `bookingCancelled`: When user cancels
- `adminCancellationWithReschedule`: When admin cancels with reschedule offer
- `bookingRescheduled`: When booking is successfully rescheduled

### Payment & Refund Handling

**Payment Statuses:**

- `pending`: Payment authorized but not captured
- `paid`: Payment captured
- `failed`: Payment failed
- `refunded`: Payment refunded

**Refund Processing:**

- Automatic refund when admin rejects booking
- Conditional refund based on cancellation timing
- Integration with Stripe for payment processing

## 🗄️ Database Schema

### Booking Model Enhancements

```javascript
// New fields added for rescheduling
rescheduleOffered: {
  type: Boolean,
  default: false,
},
rescheduleOfferedAt: Date,
rescheduleAccepted: {
  type: Boolean,
  default: false,
},
rescheduleAcceptedAt: Date,
originalScheduledDate: Date,
originalScheduledTime: String,
```

### Booking Status Flow

```
pending → confirmed → in-progress → completed
    ↓
cancelled (by user or admin)
    ↓
rescheduleOffered: true (if admin offers)
    ↓
rescheduleAccepted: true (if user accepts)
    ↓
confirmed (new appointment)
```

## 🎨 User Interface

### Admin Dashboard (`/admin/bookings`)

**Features:**

- Real-time statistics cards
- Tabbed interface for different booking statuses
- Search and filter functionality
- Action buttons for each booking status
- Responsive design for mobile and desktop

**Action Buttons:**

- **Pending Bookings:** Accept, Reject
- **Confirmed Bookings:** Cancel (with reschedule option)
- **All Bookings:** View details

### User Bookings Page (`/bookings`)

**Features:**

- Upcoming vs Past bookings tabs
- Cancellation reason display
- Reschedule offer notifications
- Quick action buttons

**Reschedule Dialog:**

- Calendar for date selection
- Available time slots display
- Original vs new appointment comparison
- Confirmation flow

## 🔧 API Endpoints

### Admin Endpoints

```bash
# Get all bookings (admin)
GET /api/bookings/admin/all?status=pending&search=john&page=1&limit=20

# Accept booking
POST /api/bookings/admin/:id/accept
{
  "assignedStaff": "staff_id",
  "notes": "Optional notes"
}

# Reject booking
POST /api/bookings/admin/:id/reject
{
  "reason": "Required rejection reason",
  "refundAmount": 85.00
}

# Cancel booking (admin)
POST /api/bookings/admin/:id/cancel
{
  "reason": "Required cancellation reason",
  "offerReschedule": true,
  "refundAmount": 85.00
}

# Get available slots for rescheduling
GET /api/bookings/admin/:id/available-slots?date=2024-01-15&duration=120
```

### User Endpoints

```bash
# Cancel booking (user)
POST /api/bookings/:id/cancel
{
  "reason": "Optional cancellation reason"
}

# Reschedule booking
POST /api/bookings/:id/reschedule
{
  "scheduledDate": "2024-01-20",
  "scheduledTime": "14:00"
}
```

### Cancel Booking (Protected)

```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "schedule_conflict"
  }'
```

### Cancel Booking (Admin)

```bash
curl -X POST http://localhost:5000/api/bookings/admin/BOOKING_ID/cancel \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "staff_unavailable",
    "offerReschedule": true,
    "refundAmount": 85.00
  }'
```

### Reject Booking (Admin)

```bash
curl -X POST http://localhost:5000/api/bookings/admin/BOOKING_ID/reject \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "service_not_available",
    "refundAmount": 85.00
  }'
```

## 📧 Email Templates

### Admin Cancellation with Reschedule Offer

```html
<div
  style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;"
>
  <h3 style="color: #28a745;">Would you like to reschedule?</h3>
  <p>
    We understand this may be inconvenient and would be happy to help you find a
    new appointment time.
  </p>
  <a
    href="${process.env.FRONTEND_URL}/bookings"
    style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;"
  >
    Reschedule Now
  </a>
</div>
```

## 🚀 Getting Started

### Prerequisites

1. Node.js and npm installed
2. MongoDB database
3. Stripe account for payments
4. Email service (SMTP or service like SendGrid)

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/car-detailing

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Installation

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 🔒 Security Considerations

1. **Authentication:** All booking endpoints require JWT authentication
2. **Authorization:** Admin endpoints require admin role
3. **Input Validation:** All inputs are validated using middleware
4. **Payment Security:** Stripe handles sensitive payment data
5. **Rate Limiting:** Implement rate limiting for booking creation

## 🧪 Testing

### Test Scenarios

1. **User creates booking** → Status: pending
2. **Admin accepts booking** → Status: confirmed, email sent
3. **Admin rejects booking** → Status: cancelled, refund processed
4. **User cancels booking** → Status: cancelled, refund based on timing
5. **Admin cancels with reschedule** → Status: cancelled, reschedule offered
6. **User reschedules** → Status: confirmed, new appointment

### API Testing

```bash
# Test booking creation
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "services": [{"service": "service_id", "quantity": 1}],
    "scheduledDate": "2024-01-15",
    "scheduledTime": "14:00",
    "vehicle": {...},
    "address": {...}
  }'
```

## 📈 Future Enhancements

1. **Automated Reminders:** SMS/email reminders before appointments
2. **Recurring Bookings:** Weekly/monthly subscription model
3. **Staff Management:** Assign specific staff to bookings
4. **Analytics Dashboard:** Booking trends and revenue reports
5. **Mobile App:** Native mobile application
6. **Integration:** Calendar integration (Google Calendar, Outlook)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
