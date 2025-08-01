# Stripe Integration

This document explains how Stripe payment processing is integrated into the car detailing appointment booking system.

## Overview

The Stripe integration allows users to:

- Pay for car detailing services using credit/debit cards
- Save payment methods for future use
- Use saved payment methods for recurring payments
- Process secure payments through Stripe's infrastructure

## Components

### 1. StripeProvider (`components/providers/StripeProvider.tsx`)

- Initializes Stripe with the publishable key
- Provides Stripe context to child components
- Configures Stripe appearance to match the app theme

### 2. StripeCardInput (`components/StripeCardInput.tsx`)

- Renders Stripe's CardElement for secure card input
- Handles card validation and error display
- Provides completion status to parent components

### 3. PaymentSection (`components/PaymentSection.tsx`)

- Main payment interface component
- Displays saved payment methods
- Allows adding new payment methods
- Processes payments through Stripe

## API Integration

### Frontend API Routes

- `/api/create-payment-intent` - Creates Stripe payment intents

### Backend API Endpoints

- `POST /api/payments/create-intent` - Creates payment intent
- `POST /api/payments/confirm` - Confirms payment
- `GET /api/payments/methods` - Gets user's saved payment methods
- `POST /api/payments/methods` - Adds new payment method
- `DELETE /api/payments/methods/:id` - Removes payment method

## Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

For the backend, add:

```env
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## Payment Flow

1. **Booking Creation**: User creates a booking with service details
2. **Payment Intent**: System creates a Stripe payment intent
3. **Payment Method Selection**: User chooses saved method or enters new card
4. **Payment Processing**: Stripe processes the payment
5. **Confirmation**: Payment is confirmed and booking is updated

## Features

### Saved Payment Methods

- Users can save payment methods for future use
- Payment methods are securely stored in Stripe
- Users can select from saved methods during checkout

### New Card Entry

- Secure card input using Stripe Elements
- Real-time validation and error handling
- Option to save new cards for future use

### Error Handling

- Comprehensive error handling for payment failures
- User-friendly error messages
- Graceful fallbacks for network issues

## Security

- All sensitive card data is handled by Stripe
- No card data is stored on our servers
- PCI compliance is handled by Stripe
- Secure communication using HTTPS

## Testing

Use Stripe's test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

## Webhook Handling

The backend handles Stripe webhooks for:

- Payment success/failure events
- Refund processing
- Payment method updates

## Troubleshooting

### Common Issues

1. **"Stripe not initialized" error**

   - Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
   - Ensure StripeProvider wraps the component

2. **Payment intent creation fails**

   - Verify backend Stripe configuration
   - Check booking ID is valid
   - Ensure user is authenticated

3. **Card validation errors**
   - Check card details are correct
   - Verify card is not expired
   - Ensure sufficient funds

### Debug Mode

Enable Stripe debug mode by adding to your environment:

```env
STRIPE_DEBUG=true
```

## Production Deployment

1. Switch to live Stripe keys
2. Configure webhook endpoints
3. Set up proper error monitoring
4. Test payment flows thoroughly
5. Monitor payment success rates
