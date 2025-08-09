# Book Appointment Flow and Pricing Calculation Documentation

## Overview

This document provides a comprehensive overview of the book appointment flow and pricing calculation system for the car detailing service application.

## Table of Contents

1. [Book Appointment Flow](#book-appointment-flow)
2. [Pricing Calculation System](#pricing-calculation-system)
3. [Service Types and Pricing](#service-types-and-pricing)
4. [Frequency-Based Discounts](#frequency-based-discounts)
5. [Seasonal Pricing](#seasonal-pricing)
6. [Add-on Services](#add-on-services)
7. [Promo Code System](#promo-code-system)
8. [Tax Calculation](#tax-calculation)
9. [Technical Implementation](#technical-implementation)

## Book Appointment Flow

### Step 1: Service Selection (`/book-appointment?step=service`)

**Components Involved:**

- `ServiceList.tsx` - Main service selection component
- `BookingContext.tsx` - State management
- `usePricing.ts` - Pricing calculation hook

**Flow:**

1. User selects from available services:

   - Interior Only ($30 base)
   - Exterior Only ($20 base)
   - Full Detail ($80 base)

2. User can add extras:

   - Wax & Polish ($25)
   - Engine Bay Cleaning ($35)
   - Pet Hair Removal ($20)
   - Odor Elimination ($30)
   - Headlight Restoration ($40)

3. Vehicle selection:

   - Existing vehicles (if user is logged in)
   - New vehicle details (make, model, year, type, color)

4. Real-time pricing calculation based on:
   - Selected service
   - Vehicle type
   - Selected extras
   - Frequency (one-time, weekly, bi-weekly)

### Step 2: Date and Time Selection (`/book-appointment?step=date-time`)

**Components Involved:**

- `DateTimePicker.tsx` - Date and time selection
- `BookingContext.tsx` - State management

**Flow:**

1. User selects preferred date
2. User selects time slot:
   - 08:00 AM - 12:00 PM
   - 04:00 PM - 08:00 PM
3. Option for ASAP booking
4. Frequency selection (affects pricing)

### Step 3: Location Selection (`/book-appointment?step=location`)

**Components Involved:**

- `LocationStep.tsx` - Address input and validation
- `AddressDialog.tsx` - Address selection modal

**Flow:**

1. User enters service address
2. Address validation and formatting
3. Optional special instructions
4. Location confirmation

### Step 4: Payment (`/book-appointment?step=payment`)

**Components Involved:**

- `PaymentSection.tsx` - Payment processing
- `StripeCardInput.tsx` - Stripe integration
- `usePricing.ts` - Final pricing calculation

**Flow:**

1. Review booking details
2. Apply promo codes (if any)
3. Final pricing calculation
4. Payment method selection
5. Payment processing via Stripe
6. Booking confirmation

## Pricing Calculation System

### Core Pricing Components

The pricing system is built around several key components:

1. **Base Service Prices** - Fixed prices for core services
2. **Vehicle Type Adjustments** - Additional charges based on vehicle size/type
3. **Seasonal Pricing** - Peak/off-peak season adjustments
4. **Frequency Discounts** - Recurring service discounts
5. **Add-on Services** - Additional services and their pricing
6. **Promo Codes** - Discount codes and validation
7. **Tax Calculation** - Applicable taxes

### Pricing Calculation Formula

```
Base Price = Service Base Price + Vehicle Type Adjustment
Seasonal Price = Base Price × Seasonal Multiplier
Service Total = Seasonal Price × Quantity
Subtotal = Sum of all services + Sum of all add-ons
Discounted Subtotal = Subtotal × Frequency Multiplier
Tax = Discounted Subtotal × Tax Rate
Total = Discounted Subtotal + Tax
```

## Service Types and Pricing

### Core Services

| Service       | Base Price | Duration  | Description                                 |
| ------------- | ---------- | --------- | ------------------------------------------- |
| Interior Only | $30        | 2 hours   | Deep clean seats, carpets, panels, and more |
| Exterior Only | $20        | 1.5 hours | Wash, polish, and protect car's exterior    |
| Full Detail   | $80        | 4 hours   | Complete interior and exterior service      |

### Service Features

**Interior Only Features:**

- Vacuum and steam clean seats
- Clean and condition leather/vinyl
- Detail dashboard and console
- Clean door panels and handles
- Vacuum and clean carpets
- Clean windows and mirrors
- Deodorize interior

**Exterior Only Features:**

- Hand wash with premium soap
- Clay bar treatment
- Paint correction (light)
- Wax application
- Tire and wheel cleaning
- Trim restoration
- Glass cleaning

**Full Detail Features:**

- Complete interior cleaning
- Complete exterior detailing
- Engine bay cleaning
- Paint protection
- Interior protection
- Premium wax application
- Tire dressing

## Frequency-Based Discounts

Recurring service discounts encourage customer retention:

| Frequency | Discount | Multiplier | Description                      |
| --------- | -------- | ---------- | -------------------------------- |
| One-time  | 0%       | 1.0        | Single service                   |
| Weekly    | 20%      | 0.8        | Weekly service - 20% discount    |
| Bi-weekly | 15%      | 0.85       | Bi-weekly service - 15% discount |
| Monthly   | 5%       | 0.95       | Monthly service - 5% discount    |

## Seasonal Pricing

Seasonal pricing adjusts based on demand periods:

| Season   | Multiplier | Period          | Description                    |
| -------- | ---------- | --------------- | ------------------------------ |
| Peak     | 1.1        | April-September | 10% premium during high demand |
| Off-peak | 0.9        | October-March   | 10% discount during low demand |

**Seasonal Calculation:**

```javascript
const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 8) return "peak"; // April to September
  return "off-peak"; // October to March
};
```

## Add-on Services

Additional services that can be combined with core services:

| Add-on                | Price | Duration | Compatible With            |
| --------------------- | ----- | -------- | -------------------------- |
| Wax & Polish          | $25   | 45 min   | All services               |
| Engine Bay Cleaning   | $35   | 30 min   | Exterior Only, Full Detail |
| Pet Hair Removal      | $20   | 20 min   | Interior Only, Full Detail |
| Odor Elimination      | $30   | 15 min   | Interior Only, Full Detail |
| Headlight Restoration | $40   | 60 min   | Exterior Only, Full Detail |

## Promo Code System

### Available Promo Codes

| Code        | Discount | Minimum Amount | Description           |
| ----------- | -------- | -------------- | --------------------- |
| WELCOME10   | 10%      | $50            | Welcome discount      |
| SAVE20      | 20%      | $100           | High-value discount   |
| NEWCUSTOMER | 15%      | $75            | New customer discount |

### Promo Code Validation

```javascript
const validatePromoCode = (promoCode, subtotal, serviceIds = []) => {
  const validPromoCodes = {
    WELCOME10: { discount: 0.1, minAmount: 50 },
    SAVE20: { discount: 0.2, minAmount: 100 },
    NEWCUSTOMER: { discount: 0.15, minAmount: 75 },
  };

  const promo = validPromoCodes[promoCode?.toUpperCase()];
  if (!promo) return { valid: false, message: "Invalid promo code" };
  if (subtotal < promo.minAmount) {
    return {
      valid: false,
      message: `Minimum order amount is $${promo.minAmount}`,
    };
  }

  const discountAmount = subtotal * promo.discount;
  const finalAmount = subtotal - discountAmount;

  return {
    valid: true,
    message: `${promo.discount * 100}% discount applied!`,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
};
```

## Tax Calculation

**Tax Rate:** 8% (configurable per location)

**Tax Calculation:**

```javascript
const tax = discountedSubtotal * pricingConfig.taxRate;
const total = discountedSubtotal + tax;
```

## Technical Implementation

### Backend Architecture

**Key Files:**

- `backend/config/pricing.js` - Pricing configuration and helper functions
- `backend/controllers/pricingController.js` - Pricing calculation endpoints
- `backend/controllers/bookingController.js` - Booking creation and pricing integration
- `backend/models/Booking.js` - Booking model with pricing calculations

**Pricing Calculation Flow:**

1. Frontend sends pricing request with service IDs, vehicle type, frequency
2. Backend maps service IDs to service names
3. Calculates base price + vehicle adjustment
4. Applies seasonal pricing multiplier
5. Calculates frequency discount
6. Adds add-on services
7. Applies promo code (if valid)
8. Calculates tax
9. Returns final pricing breakdown

### Frontend Architecture

**Key Files:**

- `frontend/hooks/usePricing.ts` - Pricing calculation hook
- `frontend/contexts/BookingContext.tsx` - Booking state management
- `frontend/components/ServiceList.tsx` - Service selection with pricing
- `frontend/components/PaymentSection.tsx` - Payment processing with pricing

**Pricing Integration:**

1. Real-time pricing updates on service selection
2. Vehicle type changes trigger price recalculation
3. Frequency selection updates discounts
4. Promo code validation and application
5. Final pricing display before payment

### API Endpoints

**Pricing Calculation:**

```
POST /api/pricing/calculate
Body: {
  selectedServiceId: number,
  selectedExtras: string[],
  vehicleType: string,
  frequency: string,
  promoCode?: string
}
```

**Promo Code Validation:**

```
POST /api/pricing/validate-promo
Body: {
  promoCode: string,
  subtotal: number
}
```

**Service List:**

```
GET /api/pricing/services
```

### State Management

The booking flow uses React Context for state management:

```typescript
interface BookingContextType {
  step: string;
  selectedServiceId: number | null;
  selectedExtras: string[];
  selectedDate: string;
  selectedSlot: string;
  location: string;
  addressData: AddressData | null;
  selectedFrequency: string;
  promoCode: string;
  pricing: { subtotal: number; discount: number; total: number } | null;
  carDetails: CarDetails | null;
  // ... other state properties
}
```

### Error Handling

**Pricing Errors:**

- Invalid service selection
- Vehicle type not supported
- Promo code validation failures
- Network errors during calculation

**Booking Errors:**

- Required fields missing
- Invalid date/time selection
- Payment processing failures
- Address validation errors

## Conclusion

The book appointment flow and pricing calculation system provides a comprehensive, user-friendly experience for customers to book car detailing services. The system handles complex pricing scenarios including vehicle type adjustments, seasonal pricing, frequency discounts, and promo codes while maintaining a smooth user experience throughout the booking process.

The technical implementation ensures real-time pricing updates, secure payment processing, and robust error handling to provide a reliable booking experience.
