"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/hooks/useAuth";
import { apiService, Address } from "@/lib/api";
import { AddressDialog } from "@/components/AddressDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Edit3, Navigation } from "lucide-react";
import { toast } from "sonner";

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
  const { accessToken } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    instructions: "",
  });

  // Load user addresses on component mount
  useEffect(() => {
    if (accessToken) {
      loadAddresses();
    }
  }, [accessToken]);

  // Update selected address when selection changes
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const address = addresses.find(
        (addr: Address) => addr._id === selectedAddressId
      );
      if (address) {
        setSelectedAddress(address);
        setAddressForm({
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          instructions: addressForm.instructions, // Keep existing instructions
        });
      }
    } else {
      setSelectedAddress(null);
    }
  }, [selectedAddressId, addresses]);

  const loadAddresses = async () => {
    if (!accessToken) return;

    setLoadingAddresses(true);
    try {
      const response = await apiService.getAddresses(accessToken);
      if (response.success && response.data) {
        setAddresses(response.data.addresses || []);
        // Auto-select default address if available
        const defaultAddress = response.data.addresses?.find(
          (addr: Address) => addr.isDefault
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        }
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      toast.error("Failed to load saved addresses");
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    if (addressId === "new") {
      handleAddNewAddress();
    } else if (addressId === "gps") {
      handleGetLocation();
    } else {
      setSelectedAddressId(addressId);
    }
  };

  const handleAddNewAddress = () => {
    setDialogMode("add");
    setEditingAddress(null);
    setAddressDialogOpen(true);
  };

  const handleEditAddress = () => {
    if (!selectedAddress) return;
    setDialogMode("edit");
    setEditingAddress(selectedAddress);
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async (addressData: Omit<Address, "_id">) => {
    if (!accessToken) return;

    try {
      if (dialogMode === "add") {
        await apiService.addAddress(addressData, accessToken);
        toast.success("Address added successfully!");
      } else if (editingAddress) {
        await apiService.updateAddress(
          editingAddress._id,
          addressData,
          accessToken
        );
        toast.success("Address updated successfully!");
      }
      await loadAddresses(); // Reload addresses
    } catch (error) {
      console.error("Failed to save address:", error);
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  const handleNext = () => {
    // Validate that an address is selected or manually entered
    if (
      !selectedAddress &&
      (!addressForm.street.trim() ||
        !addressForm.city.trim() ||
        !addressForm.state.trim() ||
        !addressForm.zipCode.trim())
    ) {
      setError(
        "Please select an address or fill in all required address fields."
      );
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
    setSelectedAddressId(""); // Clear selected address when using GPS

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
        {/* Address Selection Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Service Address
          </h3>

          {/* Address Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Address
            </label>
            <Select
              value={selectedAddressId}
              onValueChange={handleAddressSelect}
              disabled={loadingAddresses}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingAddresses
                      ? "Loading addresses..."
                      : "Choose an address"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address._id} value={address._id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{address.label}</span>
                      <span className="text-gray-500 text-sm">
                        ({address.street}, {address.city})
                      </span>
                      {address.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <div className="flex items-center gap-2 text-green-600">
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </div>
                </SelectItem>
                <SelectItem value="gps">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Navigation className="w-4 h-4" />
                    <span>Use Current Location</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Address Display */}
          {selectedAddress && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {selectedAddress.label}
                    </span>
                    {selectedAddress.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedAddress.street}, {selectedAddress.city},{" "}
                    {selectedAddress.state} {selectedAddress.zipCode}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditAddress}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Manual Address Form (shown when no address selected or using GPS) */}
          {!selectedAddress && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {selectedAddressId === "gps"
                  ? "Location detected. You can edit the details below:"
                  : "Or enter address manually:"}
              </div>

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
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
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
          )}

          {/* Special Instructions for Selected Address */}
          {selectedAddress && (
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
          )}
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
            !selectedAddress &&
            (!addressForm.street ||
              !addressForm.city ||
              !addressForm.state ||
              !addressForm.zipCode)
          }
        >
          Continue to Payment
        </button>

        {error && (
          <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
        )}
      </div>

      {/* Address Dialog */}
      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        address={editingAddress}
        onSave={handleSaveAddress}
        mode={dialogMode}
      />
    </div>
  );
};

export default LocationStep;
