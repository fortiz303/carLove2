"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";
import { StripeCardInput } from "@/components/StripeCardInput";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, CreditCard, Plus } from "lucide-react";
import { usePricing } from "@/hooks/usePricing";
import { useServices } from "@/hooks/useServices";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export interface PaymentSectionProps {
  serviceInfo: {
    title: string;
    date: string;
    location: string;
    vehicle?: string;
  };
}

// Separate component that uses Stripe hooks
const PaymentForm = ({ serviceInfo }: PaymentSectionProps) => {
  // Helper function to format location for display
  const formatLocationForDisplay = (location: string) => {
    if (!location || location === "Address not set") {
      return "Address not set";
    }

    // If it's a formatted address from LocationStep, extract the main parts
    if (location.includes(",")) {
      const parts = location.split(", ");
      if (parts.length >= 3) {
        // Return city, state format for display
        const city = parts[parts.length - 3];
        const stateZip = parts[parts.length - 2];
        const state = stateZip.split(" ")[0];
        return `${city}, ${state}`;
      } else if (parts.length === 2) {
        // Return city, state format
        return `${parts[0]}, ${parts[1]}`;
      }
    }

    // For single location strings, return as is
    return location;
  };

  const {
    selectedFrequency,
    setSelectedFrequency,
    promoCode,
    setPromoCode,
    selectedServiceId,
    selectedDate,
    selectedSlot,
    location,
    selectedExtras,
    carDetails,
  } = useBooking();

  const {
    pricing,
    loading: pricingLoading,
    error: pricingError,
    promoCodeValidation,
    validatePromoCode,
    getSavings,
    getFinalTotal,
  } = usePricing();

  const { accessToken, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [isValidatingPromoCode, setIsValidatingPromoCode] = useState(false);

  // Use the services hook
  const { serviceMapping, loading: isServiceLoading } = useServices();

  // Stripe hooks - now inside Elements context
  const stripe = useStripe();
  const elements = useElements();

  // Validate promo code
  const handleValidatePromoCode = async () => {
    if (!promoCode || !isAuthenticated || !accessToken) {
      toast.error("Please enter a promo code");
      return;
    }

    if (!pricing) {
      toast.error("Please wait for pricing to load");
      return;
    }

    setIsValidatingPromoCode(true);
    try {
      const result = await validatePromoCode(promoCode);
      if (result?.valid) {
        toast.success("Promo code applied successfully!");
      } else {
        toast.error(result?.message || "Invalid promo code");
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      toast.error("Failed to validate promo code");
    } finally {
      setIsValidatingPromoCode(false);
    }
  };

  const processPaymentWithNewCard = async (clientSecret: string) => {
    if (!stripe || !elements) {
      throw new Error("Stripe not initialized");
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error("Card element not found");
    }

    console.log(
      "🔄 Processing payment with client secret:",
      clientSecret.substring(0, 20) + "..."
    );

    // First, confirm the payment intent
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    console.log("📊 Payment confirmation result:", { error, paymentIntent });

    if (error) {
      console.error("❌ Payment confirmation error:", error);
      throw new Error(error.message || "Payment failed");
    }

    if (!paymentIntent) {
      throw new Error("No payment intent returned");
    }

    console.log(
      "✅ Payment intent status after confirmation:",
      paymentIntent.status
    );
    console.log("✅ Payment intent ID:", paymentIntent.id);

    // Check if payment was confirmed successfully
    if (paymentIntent.status === "requires_capture") {
      console.log("💰 Payment confirmed, now capturing...");

      // Save the payment method if payment was successful
      if (paymentIntent.payment_method) {
        try {
          await apiService.addPaymentMethod(
            paymentIntent.payment_method as string,
            accessToken!
          );
          toast.success("Payment method saved for future use");
        } catch (error) {
          console.error("Failed to save payment method:", error);
        }
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    } else if (paymentIntent.status === "succeeded") {
      console.log("💰 Payment already succeeded!");

      // Save the payment method if payment was successful
      if (paymentIntent.payment_method) {
        try {
          await apiService.addPaymentMethod(
            paymentIntent.payment_method as string,
            accessToken!
          );
          toast.success("Payment method saved for future use");
        } catch (error) {
          console.error("Failed to save payment method:", error);
        }
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    } else {
      console.log("⚠️ Payment intent status:", paymentIntent.status);
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }
  };

  const onPay = async () => {
    if (!isCardComplete) {
      toast.error("Please complete your card details");
      return;
    }

    if (!carDetails) {
      toast.error("Please provide vehicle details");
      return;
    }

    if (!accessToken) {
      toast.error("Please log in to continue");
      return;
    }

    setIsLoading(true);
    toast.dismiss(); // Clear previous toasts

    try {
      // Parse location string to extract address components
      const address = {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
      };

      if (location && location !== "Select a location") {
        const locationParts = location.split(", ");
        if (locationParts.length >= 4) {
          address.street = locationParts[0];
          address.city = locationParts[1];
          address.state = locationParts[2];
          address.zipCode = locationParts[3];
        } else {
          address.street = location;
        }
      }

      // Handle different payment flows based on frequency
      if (selectedFrequency === "one-time") {
        // One-time booking flow
        if (!selectedServiceId) {
          toast.error("Please select a service first");
          return;
        }

        const serviceId = serviceMapping[selectedServiceId];
        if (!serviceId) {
          console.error("Service mapping issue:", {
            selectedServiceId,
            serviceMapping,
          });
          toast.error("Service not found. Please refresh and try again.");
          return;
        }

        const [datePart] = selectedDate.split("T");
        const timePart = selectedSlot.split(" ")[0];
        const [time, period] = timePart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
        const scheduledTime = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;

        const bookingData = {
          services: [
            {
              service: serviceId,
              quantity: 1,
            },
          ],
          scheduledDate: datePart,
          scheduledTime: scheduledTime,
          vehicle: {
            make: carDetails.make,
            model: carDetails.model,
            year: carDetails.year,
            color: carDetails.color,
            type: carDetails.type,
            licensePlate: carDetails.licensePlate,
            vin: carDetails.vin,
            nickname: carDetails.nickname,
          },
          address: address,
          frequency: "one-time",
          specialInstructions: "",
          saveVehicle: true,
          promoCode: promoCodeValidation?.isValid ? promoCode : undefined,
        };

        console.log("📝 Creating one-time booking with data:", bookingData);

        const response = await apiService.createBooking(
          bookingData,
          accessToken
        );

        console.log("📋 Booking response:", response);

        if (response.success) {
          const booking = response.data.booking;

          // Create payment intent for the booking
          const paymentIntentResponse = await apiService.createPaymentIntent(
            booking._id,
            accessToken
          );

          if (paymentIntentResponse.success) {
            const { clientSecret } = paymentIntentResponse.data;

            // Process payment
            const paymentResult = await processPaymentWithNewCard(clientSecret);

            if (paymentResult.success) {
              // Confirm payment
              await apiService.confirmPayment(
                paymentResult.paymentIntentId,
                accessToken
              );

              router.push(`/confirm/${booking._id}`);
            } else {
              toast.error("Payment failed");
            }
          } else {
            toast.error(
              paymentIntentResponse.message || "Failed to create payment intent"
            );
          }
        } else {
          toast.error(response.message || "Failed to create booking");
        }
      } else {
        // Subscription flow for recurring services
        if (!selectedServiceId) {
          toast.error("Please select a service first");
          return;
        }

        const serviceId = serviceMapping[selectedServiceId];
        if (!serviceId) {
          console.error("Service mapping issue:", {
            selectedServiceId,
            serviceMapping,
          });
          toast.error("Service not found. Please refresh and try again.");
          return;
        }

        const [datePart] = selectedDate.split("T");
        const timePart = selectedSlot.split(" ")[0];
        const [time, period] = timePart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
        const scheduledTime = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;

        const subscriptionData = {
          serviceId,
          frequency: selectedFrequency,
          scheduledDate: datePart,
          scheduledTime: scheduledTime,
          vehicle: {
            make: carDetails.make,
            model: carDetails.model,
            year: carDetails.year,
            color: carDetails.color,
            type: carDetails.type,
            licensePlate: carDetails.licensePlate,
            vin: carDetails.vin,
            nickname: carDetails.nickname,
          },
          address: address,
          specialInstructions: "",
        };

        console.log("📝 Creating subscription with data:", subscriptionData);

        const response = await apiService.createSubscription(
          subscriptionData,
          accessToken
        );

        console.log("📋 Subscription response:", response);

        if (response.success) {
          const { subscription, booking, stripeSubscription } = response.data;

          // Process subscription payment
          const paymentResult = await processPaymentWithNewCard(
            stripeSubscription.latest_invoice.payment_intent.client_secret
          );

          if (paymentResult.success) {
            // Confirm payment
            await apiService.confirmPayment(
              paymentResult.paymentIntentId,
              accessToken
            );

            router.push(`/confirm/${booking._id}`);
          } else {
            toast.error("Payment failed");
          }
        } else {
          toast.error(response.message || "Failed to create subscription");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("card")) {
          toast.error(
            "Card payment failed. Please check your card details and try again."
          );
        } else if (error.message.includes("network")) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else if (error.message.includes("authentication")) {
          toast.error("Authentication error. Please log in again.");
        } else {
          toast.error(`Payment error: ${error.message}`);
        }
      } else {
        toast.error("An error occurred during payment. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      {/* {JSON.stringify(clientSecret)} */}
      <Card className="rounded-2xl p-4 md:p-6 shadow-md">
        {/* Service Info */}
        <div className="bg-green-900 text-white rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h2 className="font-semibold text-base md:text-lg">
              {serviceInfo.title}
            </h2>
            <div className="flex gap-2 text-sm mt-1 text-white/90 flex-wrap">
              <Calendar className="w-4 h-4" />
              <span>{serviceInfo.date}</span>
              <MapPin className="w-4 h-4" />
              <span
                className="max-w-[200px] sm:max-w-none truncate cursor-help"
                title={
                  serviceInfo.location !==
                  formatLocationForDisplay(serviceInfo.location)
                    ? serviceInfo.location
                    : undefined
                }
              >
                {formatLocationForDisplay(serviceInfo.location)}
              </span>
              {serviceInfo.vehicle && (
                <>
                  <span>•</span>
                  <span className="max-w-[150px] sm:max-w-none truncate">
                    {serviceInfo.vehicle}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="mt-6 space-y-2 text-sm text-gray-800">
          <p className="font-medium">Choose Your Service Frequency</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="freq"
                checked={selectedFrequency === "one-time"}
                onChange={() => setSelectedFrequency("one-time")}
                className="w-4 h-4 text-green-600"
              />
              <div className="flex-1">
                <div className="font-medium">One-time Service</div>
                <div className="text-sm text-gray-600">
                  Single service appointment
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$55.59</div>
                <div className="text-xs text-gray-500">Regular price</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="freq"
                checked={selectedFrequency === "weekly"}
                onChange={() => setSelectedFrequency("weekly")}
                className="w-4 h-4 text-green-600"
              />
              <div className="flex-1">
                <div className="font-medium">Weekly Service</div>
                <div className="text-sm text-gray-600">
                  Every week • 15% discount
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$47.25</div>
                <div className="text-xs text-green-600">Save $8.34</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="freq"
                checked={selectedFrequency === "bi-weekly"}
                onChange={() => setSelectedFrequency("bi-weekly")}
                className="w-4 h-4 text-green-600"
              />
              <div className="flex-1">
                <div className="font-medium">Bi-Weekly Service</div>
                <div className="text-sm text-gray-600">
                  Every 2 weeks • 10% discount
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$50.40</div>
                <div className="text-xs text-green-600">Save $5.19</div>
              </div>
            </label>
          </div>

          {/* Frequency Info */}
          {selectedFrequency !== "one-time" && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Recurring Service:</strong> Your service will
                automatically repeat every{" "}
                {selectedFrequency === "weekly" ? "week" : "2 weeks"} on the
                same day and time. You can cancel or modify your schedule
                anytime from your dashboard.
              </div>
            </div>
          )}

          {/* promo code */}
          <div className="mt-4">
            <div className="flex w-full rounded-full overflow-hidden border focus-within:ring-2 focus-within:ring-green-700">
              <input
                type="text"
                placeholder="Promo Code"
                className="w-0 flex-grow px-4 py-2 text-sm outline-none border-none"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={handleValidatePromoCode}
                disabled={isValidatingPromoCode || !promoCode}
                className="bg-green-800 text-white px-4 sm:px-6 text-sm font-medium shrink-0 hover:bg-green-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidatingPromoCode ? "Validating..." : "Apply"}
              </button>
            </div>
            {promoCodeValidation && (
              <div
                className={`mt-2 text-sm ${
                  promoCodeValidation.isValid
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {promoCodeValidation.message}
              </div>
            )}
          </div>
        </div>

        {/* Card Input */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">Card Details</p>
          <StripeCardInput
            onCardComplete={setIsCardComplete}
            disabled={isLoading}
          />
        </div>

        {/* Pricing */}
        {pricing && (
          <div className="mt-6 space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${pricing.subtotal.toFixed(2)}</span>
            </div>
            {promoCodeValidation?.isValid &&
              promoCodeValidation.discountAmount && (
                <div className="flex justify-between">
                  <span>Promo Code Discount:</span>
                  <span className="text-red-500">
                    - ${promoCodeValidation.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
            <div className="flex justify-between">
              <span>Frequency Discount:</span>
              <span className="text-red-500">
                - ${pricing.frequencyDiscount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base text-green-700">
              <span>TOTAL:</span>
              <span>
                $
                {promoCodeValidation?.isValid && promoCodeValidation.finalAmount
                  ? promoCodeValidation.finalAmount.toFixed(2)
                  : pricing.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Pay Now */}
        <Button
          className="w-full mt-6 bg-green-700 text-white rounded-full font-semibold h-12 text-base"
          onClick={onPay}
          disabled={isLoading || isServiceLoading}
        >
          {isLoading
            ? "Creating Booking..."
            : isServiceLoading
            ? "Loading..."
            : "Pay Now"}
        </Button>
      </Card>
    </div>
  );
};

// Main component that wraps PaymentForm with StripeProvider
const PaymentSection = ({ serviceInfo }: PaymentSectionProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  return (
    <StripeProvider
      key={clientSecret || "initial"}
      clientSecret={clientSecret || undefined}
    >
      <PaymentForm serviceInfo={serviceInfo} />
    </StripeProvider>
  );
};

export default PaymentSection;
