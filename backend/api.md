# Car Detailing Backend API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "phone": "+1234567890"
  }'
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'
```

### Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

### Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "password": "newPassword123"
  }'
```

### Get Current User (Protected)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Change Password (Protected)

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }'
```

### Logout (Protected)

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### OAuth Routes

#### Google OAuth

```bash
# Initiate Google OAuth
curl -X GET http://localhost:5000/api/auth/google

# Google OAuth Callback (handled by frontend)
curl -X GET "http://localhost:5000/api/auth/google/callback?code=AUTHORIZATION_CODE"
```

#### Facebook OAuth

```bash
# Initiate Facebook OAuth
curl -X GET http://localhost:5000/api/auth/facebook

# Facebook OAuth Callback (handled by frontend)
curl -X GET "http://localhost:5000/api/auth/facebook/callback?code=AUTHORIZATION_CODE"
```

#### Apple OAuth

```bash
# Initiate Apple OAuth
curl -X GET http://localhost:5000/api/auth/apple

# Apple OAuth Callback (handled by frontend)
curl -X GET "http://localhost:5000/api/auth/apple/callback?code=AUTHORIZATION_CODE"
```

## Services

### Get All Services

```bash
curl -X GET "http://localhost:5000/api/services?page=1&limit=10"
```

### Get Popular Services

```bash
curl -X GET http://localhost:5000/api/services/popular
```

### Get Services by Category

```bash
curl -X GET http://localhost:5000/api/services/category/exterior
```

### Get Service by ID

```bash
curl -X GET http://localhost:5000/api/services/SERVICE_ID
```

### Calculate Service Price

```bash
curl -X POST http://localhost:5000/api/services/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "SERVICE_ID",
    "vehicleType": "sedan",
    "addOns": ["wax", "interior_cleaning"]
  }'
```

### Create Service (Admin Only)

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Wash",
    "description": "Complete exterior and interior cleaning",
    "price": 89.99,
    "duration": 120,
    "category": "full_service",
    "features": ["exterior_wash", "interior_cleaning", "wax"]
  }'
```

### Update Service (Admin Only)

```bash
curl -X PUT http://localhost:5000/api/services/SERVICE_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Wash Plus",
    "price": 99.99
  }'
```

### Delete Service (Admin Only)

```bash
curl -X DELETE http://localhost:5000/api/services/SERVICE_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get Service Stats (Admin Only)

```bash
curl -X GET http://localhost:5000/api/services/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Bookings

### Create Booking (Protected)

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "SERVICE_ID",
    "scheduledDate": "2024-01-15T10:00:00Z",
    "vehicleType": "sedan",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehicleYear": 2020,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    },
    "specialInstructions": "Please be careful with the paint"
  }'
```

### Get User Bookings (Protected)

```bash
curl -X GET "http://localhost:5000/api/bookings?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Available Slots (Protected)

```bash
curl -X GET "http://localhost:5000/api/bookings/available-slots?date=2024-01-15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Booking by ID (Protected)

```bash
curl -X GET http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Booking (Protected)

```bash
curl -X PUT http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledDate": "2024-01-16T14:00:00Z",
    "specialInstructions": "Updated instructions"
  }'
```

### Cancel Booking (Protected)

```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Review to Booking (Protected)

```bash
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent service! Very professional and thorough."
  }'
```

### Get Booking Stats (Admin Only)

```bash
curl -X GET "http://localhost:5000/api/bookings/admin/stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Payments

### Create Payment Intent (Protected)

```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 8999,
    "currency": "usd",
    "bookingId": "BOOKING_ID"
  }'
```

### Confirm Payment (Protected)

```bash
curl -X POST http://localhost:5000/api/payments/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "bookingId": "BOOKING_ID"
  }'
```

### Get Payment Methods (Protected)

```bash
curl -X GET http://localhost:5000/api/payments/methods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Payment Method (Protected)

```bash
curl -X POST http://localhost:5000/api/payments/methods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "pm_1234567890"
  }'
```

### Remove Payment Method (Protected)

```bash
curl -X DELETE http://localhost:5000/api/payments/methods/PAYMENT_METHOD_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Process Refund (Admin Only)

```bash
curl -X POST http://localhost:5000/api/payments/refund \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "amount": 4500,
    "reason": "Customer cancellation"
  }'
```

### Stripe Webhook (No Auth Required)

```bash
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: WEBHOOK_SIGNATURE" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_1234567890",
        "amount": 8999,
        "currency": "usd"
      }
    }
  }'
```

## User Profile

### Get Profile (Protected)

```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile (Protected)

```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890"
  }'
```

### Update Preferences (Protected)

```bash
curl -X PUT http://localhost:5000/api/user/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "preferences": {
      "preferredTime": "morning",
      "vehicleType": "sedan"
    }
  }'
```

### Get User Stats (Protected)

```bash
curl -X GET http://localhost:5000/api/user/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Addresses

### Get Addresses (Protected)

```bash
curl -X GET http://localhost:5000/api/user/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Address (Protected)

```bash
curl -X POST http://localhost:5000/api/user/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "isDefault": true
  }'
```

### Update Address (Protected)

```bash
curl -X PUT http://localhost:5000/api/user/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "456 Oak Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002"
  }'
```

### Delete Address (Protected)

```bash
curl -X DELETE http://localhost:5000/api/user/addresses/ADDRESS_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Default Address (Protected)

```bash
curl -X GET http://localhost:5000/api/user/addresses/default \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Set Default Address (Protected)

```bash
curl -X PUT http://localhost:5000/api/user/addresses/ADDRESS_ID/default \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Account (Protected)

```bash
curl -X DELETE http://localhost:5000/api/user/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Support

### Create Support Ticket (Protected)

```bash
curl -X POST http://localhost:5000/api/support/tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Booking Issue",
    "message": "I need to reschedule my appointment",
    "priority": "medium",
    "category": "booking"
  }'
```

### Get User Tickets (Protected)

```bash
curl -X GET "http://localhost:5000/api/support/tickets?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Ticket by ID (Protected)

```bash
curl -X GET http://localhost:5000/api/support/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Respond to Ticket (Protected)

```bash
curl -X POST http://localhost:5000/api/support/tickets/TICKET_ID/respond \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I can help you reschedule your appointment"
  }'
```

### Close Ticket (Protected)

```bash
curl -X POST http://localhost:5000/api/support/tickets/TICKET_ID/close \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Satisfaction Rating (Protected)

```bash
curl -X POST http://localhost:5000/api/support/tickets/TICKET_ID/satisfaction \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Great support experience"
  }'
```

### Get All Tickets (Admin Only)

```bash
curl -X GET "http://localhost:5000/api/support/admin/tickets?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Assign Ticket (Admin Only)

```bash
curl -X PUT http://localhost:5000/api/support/admin/tickets/TICKET_ID/assign \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": "STAFF_USER_ID"
  }'
```

### Resolve Ticket (Admin Only)

```bash
curl -X POST http://localhost:5000/api/support/admin/tickets/TICKET_ID/resolve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Escalate Ticket (Admin Only)

```bash
curl -X POST http://localhost:5000/api/support/admin/tickets/TICKET_ID/escalate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get Support Stats (Admin Only)

```bash
curl -X GET http://localhost:5000/api/support/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Health Check

### Check API Status

```bash
curl -X GET http://localhost:5000/health
```

## Notes

- Replace `YOUR_JWT_TOKEN` with the actual JWT token received from login
- Replace `ADMIN_JWT_TOKEN` with an admin user's JWT token for admin-only endpoints
- Replace placeholder IDs (like `SERVICE_ID`, `BOOKING_ID`, etc.) with actual IDs
- The API runs on port 5000 by default
- All protected routes require a valid JWT token in the Authorization header
- Admin routes require both authentication and admin authorization
- OAuth callback URLs are typically handled by the frontend application
