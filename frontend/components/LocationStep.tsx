"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts/BookingContext";
import { useEffect } from "react";

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  instructions: string;
}

const LocationStep = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const { location, setLocation } = useBooking();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    instructions: "",
  });

  const handleNext = () => {
    // Validate required fields
    if (
      !addressForm.street.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.zipCode.trim()
    ) {
      setError("Please fill in all required address fields.");
      return;
    }

    // Create formatted address string
    const formattedAddress = `${addressForm.street}, ${addressForm.city}, ${addressForm.state} ${addressForm.zipCode}, ${addressForm.country}`;
    setLocation(formattedAddress);
    setError("");
    router.push("/book-appointment?step=payment");
  };

  const handleInputChange = (field: keyof AddressForm, value: string) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleGetLocation = async () => {
    setError("");
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        try {
          // Reverse geocode using OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
          );
          const data = await res.json();

          if (data && data.address) {
            const address = data.address;
            setAddressForm({
              street: `${address.house_number || ""} ${
                address.road || ""
              }`.trim(),
              city: address.city || address.town || address.village || "",
              state: address.state || "",
              zipCode: address.postcode || "",
              country: address.country_code?.toUpperCase() || "US",
              instructions: addressForm.instructions, // Keep existing instructions
            });
          } else {
            setError("Could not retrieve address details from location.");
          }
        } catch (e) {
          setError("Failed to fetch address details from coordinates.");
        }
        setLoadingLocation(false);
      },
      (err) => {
        setError(
          "Unable to retrieve your location. Please enter address manually."
        );
        setLoadingLocation(false);
      }
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 mt-6">
      <div className="space-y-6">
        {/* Auto Fetch Button */}
        <div className="flex flex-col gap-2 items-center">
          <button
            type="button"
            className="h-10 px-4 bg-blue-600 text-white rounded-lg font-semibold whitespace-nowrap hover:bg-blue-700 transition-colors"
            onClick={handleGetLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? "Locating..." : "Auto Fetch My Location"}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Click to automatically fill your address using GPS
          </p>
        </div>

        {/* Address Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Service Address
          </h3>

          {/* Street Address */}
          <div className="space-y-2">
            <label
              htmlFor="street"
              className="block text-sm font-medium text-gray-700"
            >
              Street Address *
            </label>
            <input
              type="text"
              id="street"
              value={addressForm.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* City and State Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City *
              </label>
              <input
                type="text"
                id="city"
                value={addressForm.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="New York"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700"
              >
                State *
              </label>
              <input
                type="text"
                id="state"
                value={addressForm.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="NY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* ZIP Code and Country Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-gray-700"
              >
                ZIP Code *
              </label>
              <input
                type="text"
                id="zipCode"
                value={addressForm.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="10001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700"
              >
                Country
              </label>
              <select
                id="country"
                value={addressForm.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-gray-700"
            >
              Special Instructions (Optional)
            </label>
            <textarea
              id="instructions"
              value={addressForm.instructions}
              onChange={(e) =>
                handleInputChange("instructions", e.target.value)
              }
              placeholder="Gate code, apartment number, parking instructions, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Map Display */}
        {coords && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Location Preview
            </h4>
            <iframe
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
            />
          </div>
        )}

        {/* Continue Button */}
        <button
          className="w-full h-12 mt-6 bg-green-700 text-white rounded-full font-semibold hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={handleNext}
          disabled={
            !addressForm.street ||
            !addressForm.city ||
            !addressForm.state ||
            !addressForm.zipCode
          }
        >
          Continue to Payment
        </button>

        {error && (
          <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default LocationStep;
