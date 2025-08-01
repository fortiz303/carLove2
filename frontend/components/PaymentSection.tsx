"use client";

import { useBooking } from "@/contexts/BookingContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { detailingOptions } from "@/lib/book-appointment";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { StripeCardInput } from "@/components/StripeCardInput";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export interface PaymentSectionProps {
  serviceInfo: {
    title: string;
    date: string;
    location: string;
    vehicle?: string;
  };
}

const PaymentSection = ({ serviceInfo }: PaymentSectionProps) => {
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
    pricing,
    selectedServiceId,
    selectedDate,
    selectedSlot,
    location,
    selectedExtras,
    carDetails,
  } = useBooking();

  const { accessToken, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serviceMapping, setServiceMapping] = useState<{
    [key: number]: string;
  }>({});
  const [isServiceLoading, setIsServiceLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);

  // Fetch service mappings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsServiceLoading(true);
        // Fetch services
        const response = await apiService.getServices();
        if (response.success && response.data?.services) {
          const mapping: { [key: number]: string } = {};
          response.data.services.forEach((service: any) => {
            const frontendService = detailingOptions.find(
              (option) => option.title === service.name
            );
            if (frontendService) {
              mapping[frontendService.id] = service._id;
            }
          });
          setServiceMapping(mapping);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsServiceLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, accessToken]);

  const onPay = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to book an appointment");
      router.push("/login");
      return;
    }
    if (
      !selectedServiceId ||
      !selectedDate ||
      !selectedSlot ||
      !location ||
      !carDetails
    ) {
      toast.error(
        "Please complete all booking details including vehicle information"
      );
      return;
    }
    if (!isCardComplete) {
      toast.error("Please enter valid card details");
      return;
    }
    setIsLoading(true);
    try {
      let serviceId = serviceMapping[selectedServiceId];
      if (!serviceId) {
        const selectedService = detailingOptions.find(
          (s) => s.id === selectedServiceId
        );
        if (!selectedService) {
          throw new Error("Invalid service selected");
        }
        serviceId = selectedService.title;
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
      // Parse the location string to extract address components
      let address = {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        instructions:
          selectedExtras.length > 0
            ? `Extras: ${selectedExtras.join(", ")}`
            : "",
      };

      // Parse the formatted address from LocationStep
      if (location.includes(",")) {
        const locationParts = location.split(", ");
        if (locationParts.length >= 4) {
          // Format: "street, city, state zipCode, country"
          const streetCityParts = locationParts.slice(0, -2);
          address.street = streetCityParts.join(", ");
          address.city = locationParts[locationParts.length - 3];

          const stateZipPart = locationParts[locationParts.length - 2];
          const stateZipMatch = stateZipPart.match(
            /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
          );
          if (stateZipMatch) {
            address.state = stateZipMatch[1];
            address.zipCode = stateZipMatch[2];
          } else {
            // Try to extract ZIP code from the state part
            const zipMatch = stateZipPart.match(/(\d{5}(?:-\d{4})?)/);
            if (zipMatch) {
              address.state = stateZipPart.replace(zipMatch[1], "").trim();
              address.zipCode = zipMatch[1];
            } else {
              address.state = stateZipPart;
              address.zipCode = "90210"; // Default ZIP
            }
          }
          address.country = locationParts[locationParts.length - 1];
        } else if (locationParts.length === 3) {
          // Format: "street, city, state zipCode"
          address.street = locationParts[0];
          address.city = locationParts[1];
          const stateZipPart = locationParts[2];
          const stateZipMatch = stateZipPart.match(
            /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
          );
          if (stateZipMatch) {
            address.state = stateZipMatch[1];
            address.zipCode = stateZipMatch[2];
          } else {
            const zipMatch = stateZipPart.match(/(\d{5}(?:-\d{4})?)/);
            if (zipMatch) {
              address.state = stateZipPart.replace(zipMatch[1], "").trim();
              address.zipCode = zipMatch[1];
            } else {
              address.state = stateZipPart;
              address.zipCode = "90210";
            }
          }
        } else if (locationParts.length === 2) {
          // Format: "street, city"
          address.street = locationParts[0];
          address.city = locationParts[1];
          address.state = "CA";
          address.zipCode = "90210";
        }
      } else {
        // Single location string
        const zipMatch = location.match(/(\d{5}(?:-\d{4})?)/);
        if (zipMatch) {
          address.street = location.replace(zipMatch[1], "").trim();
          address.city = "Service Location";
          address.state = "CA";
          address.zipCode = zipMatch[1];
        } else {
          address.street = location;
          address.city = "Service Location";
          address.state = "CA";
          address.zipCode = "90210";
        }
      }
      if (!address.zipCode || address.zipCode.length < 5) {
        address.zipCode = "90210";
      }
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
        },
        address: address,
        frequency:
          selectedFrequency === "weekly"
            ? "weekly"
            : selectedFrequency === "bi-weekly"
            ? "bi-weekly"
            : "one-time",
        specialInstructions: promoCode ? `Promo code: ${promoCode}` : "",
      };
      const response = await apiService.createBooking(
        bookingData,
        accessToken!
      );

      if (response.success) {
        toast.success("Booking created successfully!");
        router.push(`/bookings`);
      } else {
        throw new Error(response.message || "Failed to create booking");
      }

      // if (response.success) {
      //   const bookingId =
      //     response.data?.booking?._id || response.data?.booking?.id;
      //   if (!bookingId) {
      //     throw new Error("No booking ID returned");
      //   }
      //   const paymentIntentResponse = await apiService.createPaymentIntent(
      //     bookingId,
      //     accessToken!
      //   );
      //   if (!paymentIntentResponse.success) {
      //     throw new Error(
      //       paymentIntentResponse.message || "Failed to create payment intent"
      //     );
      //   }
      //   const { clientSecret: newClientSecret } = paymentIntentResponse.data;
      //   setClientSecret(newClientSecret);
      //   await processPaymentWithNewCard(newClientSecret);
      //   toast.success("Payment processed successfully!");
      //   router.push(`/confirm/${bookingId}`);
      // } else {
      //   throw new Error(response.message || "Failed to create booking");
      // }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processPaymentWithNewCard = async (clientSecret: string) => {
    const stripe = useStripe();
    const elements = useElements();

    if (!stripe || !elements) {
      throw new Error("Stripe not initialized");
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      throw new Error("Card element not found");
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (error) {
      throw new Error(error.message || "Payment failed");
    }

    // Save the payment method if payment was successful
    if (paymentIntent && paymentIntent.payment_method) {
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
  };

  return (
    <StripeProvider clientSecret={clientSecret || undefined}>
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
                  title={serviceInfo.location !== formatLocationForDisplay(serviceInfo.location) ? serviceInfo.location : undefined}
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
            <p className="font-medium">Choose Your Mowing Frequency</p>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="radio"
                  name="freq"
                  checked={selectedFrequency === "weekly"}
                  onChange={() => setSelectedFrequency("weekly")}
                />
                Weekly - $47.25 per Service
              </label>
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="radio"
                  name="freq"
                  checked={selectedFrequency === "bi-weekly"}
                  onChange={() => setSelectedFrequency("bi-weekly")}
                />
                Bi-Weekly - $50.40 per Service
              </label>
            </div>
            {/* promo code */}
            <div className="mt-4">
              <div className="flex w-full rounded-full overflow-hidden border focus-within:ring-2 focus-within:ring-green-700">
                <input
                  type="text"
                  placeholder="Promo Code"
                  className="w-0 flex-grow px-4 py-2 text-sm outline-none border-none"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-green-800 text-white px-4 sm:px-6 text-sm font-medium shrink-0 hover:bg-green-900 transition"
                >
                  Apply
                </button>
              </div>
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
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-red-500">
                  - ${pricing.discount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base text-green-700">
                <span>TOTAL:</span>
                <span>${pricing.total.toFixed(2)}</span>
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
    </StripeProvider>
  );
};

export default PaymentSection;
