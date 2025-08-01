"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home,
  Calendar,
  Plus,
  MessageCircle,
  User,
  Edit3,
  MapPin,
  Mail,
  Phone,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { apiService, Address } from "@/lib/api";
import { AddressDialog } from "@/components/AddressDialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  // Load user profile and addresses
  useEffect(() => {
    if (user && accessToken) {
      loadProfile();
      loadAddresses();
    }
  }, [user, accessToken]);

  const loadProfile = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getProfile(accessToken);
      if (response.success && response.data && response.data.user) {
        setProfileData({
          fullName: response.data.user.fullName || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
        });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const loadAddresses = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getAddresses(accessToken);
      if (response.success && response.data) {
        setAddresses(response.data.addresses || []);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
      toast.error("Failed to load addresses");
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(
        {
          fullName: profileData.fullName,
          phone: profileData.phone,
        },
        accessToken
      );

      if (response.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = () => {
    setDialogMode("add");
    setEditingAddress(null);
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setDialogMode("edit");
    setEditingAddress(address);
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!accessToken) return;

    try {
      await apiService.deleteAddress(addressId, accessToken);
      toast.success("Address deleted successfully!");
      loadAddresses(); // Reload addresses
    } catch (error) {
      console.error("Failed to delete address:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete address");
      }
    }
  };

  const handleSaveAddress = async (addressData: Omit<Address, "_id">) => {
    if (!accessToken) return;

    try {
      if (dialogMode === "add") {
        await apiService.addAddress(addressData, accessToken);
      } else if (editingAddress) {
        await apiService.updateAddress(
          editingAddress._id,
          addressData,
          accessToken
        );
      }
      loadAddresses(); // Reload addresses
    } catch (error) {
      console.error("Failed to save address:", error);
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Status Bar */}
      {/* <div className="flex justify-between items-center px-4 py-2 text-white text-sm font-medium md:hidden absolute top-0 left-0 right-0 z-10">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
          </div>
          <div className="ml-2 text-xs">📶 📶 📶</div>
          <div className="ml-1 text-xs">🔋</div>
        </div>
      </div> */}

      {/* Header Image */}
      {/* Header Image with rounded look and not full width */}
      <div className="px-4 py-2">
        <div className="relative h-48 md:h-64 overflow-hidden rounded-2xl z-0">
          <Image
            src="/images/bgprofile.jpg?height=256&width=400"
            alt="Profile background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>

      {/* Profile Picture - Separate container placed after header */}
      <div className="relative z-20 -mt-20 px-6">
        <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white shadow-md bg-white overflow-visible">
          {/* Profile Avatar with Initials */}
          <Avatar className="w-full h-full">
            <AvatarFallback className="w-full h-full text-4xl md:text-6xl font-semibold bg-gradient-to-br from-teal-500 to-teal-700 text-white">
              {getInitials(profileData.fullName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-2 pb-4 md:px-8 md:pt-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* Personal Info Card */}
          <CardContent className="p-6 space-y-3">
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                  className="h-10 rounded-lg border border-gray-300 bg-white pr-10 text-sm"
                  readOnly={!isEditing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-teal-500 hover:text-teal-600"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="h-10 rounded-lg border border-gray-300 bg-white pr-10 text-sm"
                  readOnly={!isEditing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-teal-500 hover:text-teal-600"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      phone: e.target.value,
                    })
                  }
                  className="h-10 rounded-lg border border-gray-300 bg-white pr-10 text-sm"
                  readOnly={!isEditing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-teal-500 hover:text-teal-600"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>

          {/* Saved Addresses */}

          <CardContent className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Saved Addresses
              </h3>
              <Button
                size="icon"
                className="w-8 h-8 bg-green-600 hover:bg-green-700"
                onClick={handleAddAddress}
              >
                <Plus className="w-4 h-4 text-white" />
              </Button>
            </div>

            {addresses.map((address) => (
              <div key={address._id} className="space-y-1">
                <div className="relative">
                  {/* Simulate input appearance with custom text */}
                  <div className="h-10 rounded-lg border border-gray-300 bg-white pr-10 pl-3 text-sm flex items-center">
                    <span className="font-semibold mr-1">{address.label} </span>
                    <span className="text-gray-700 truncate">
                      {`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`}
                    </span>
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-teal-500 hover:text-teal-600"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteAddress(address._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Duplicate Saved Address Section - Hidden (preserved as requested) */}
          <Card className="rounded-2xl shadow-sm p-2">
            <CardContent className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Saved Addresses
                </h3>
                <Button
                  size="icon"
                  className="w-8 h-8 bg-green-600 hover:bg-green-700"
                  onClick={handleAddAddress}
                >
                  <Plus className="w-4 h-4 text-white" />
                </Button>
              </div>
            </CardContent>
            <div className="px-6 pb-6">
              <button
                onClick={handleSave}
                disabled={!isEditing || isLoading}
                className="w-full h-11 rounded-full font-semibold text-white shadow disabled:opacity-50"
                style={{
                  backgroundColor: "#0E5814",
                }}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </Card>

          {/* Account Settings (Desktop Only) */}
          <div className="hidden md:block space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Account Settings
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Notification Preferences
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    Privacy Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                  >
                    <MapPin className="w-5 h-5 mr-3" />
                    Location Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex items-center justify-around">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 py-2"
          >
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] text-gray-400 leading-tight">
              Home
            </span>
          </Link>
          <Link
            href="/bookings"
            className="flex flex-col items-center gap-1 py-2"
          >
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] text-gray-400 leading-tight">
              Booking
            </span>
          </Link>
          <Link
            href="/booking"
            className="flex flex-col items-center gap-1 py-2"
          >
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600" />
            </div>
          </Link>
          <Link href="/chat" className="flex flex-col items-center gap-1 py-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] text-gray-400 leading-tight">
              Chat
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 py-2"
          >
            <User className="w-4 h-4 text-green-600" />
            <span className="text-[11px] text-green-600 font-semibold leading-tight">
              Profile
            </span>
          </Link>
        </div>
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
}
