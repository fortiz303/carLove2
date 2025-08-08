"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Settings,
  Home,
  Plus,
  MessageCircle,
  User,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface BookingData {
  _id: string;
  services: Array<{
    service: {
      name: string;
      description: string;
    };
    quantity: number;
    price: number;
  }>;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    type: string;
  };
  frequency: string;
  specialInstructions?: string;
  createdAt: string;
}

interface ConfirmPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConfirmPage({ params }: ConfirmPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { accessToken, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!isAuthenticated || !accessToken) {
        setError("Please login to view booking details");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getBooking(id, accessToken);

        if (response.success && response.data?.booking) {
          setBooking(response.data.booking);
        } else {
          setError(response.message || "Failed to fetch booking details");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, isAuthenticated, accessToken]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatAddress = (address: BookingData["address"]) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-700" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Booking Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Unable to load booking details"}
          </p>
          <Link href="/bookings">
            <Button className="bg-green-700 text-white">
              View All Bookings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-green-900 px-4 py-8 text-white">
        <h1 className="text-2xl font-bold mb-1">Booking Confirmed</h1>
        <p className="text-sm text-white/90">Secure & Hassle-Free Payment.</p>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-md mx-auto text-center">
        {/* Illustration */}
        <Image
          src="/images/confirm.png"
          alt="Booking confirmed"
          width={300}
          height={200}
          className="mx-auto mb-6"
        />

        <h2 className="text-xl font-bold mb-2">Your booking is confirmed!</h2>

        {/* Booking Info Box */}
        <div className="mt-4 bg-gray-50 border rounded-xl p-4 text-left text-sm space-y-3">
          {/* Service */}
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
            <span>
              <strong>Service:</strong>{" "}
              {booking.services.map((s) => s.service.name).join(", ")}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-green-700" />
              <span>
                <strong>Date:</strong> {formatDate(booking.scheduledDate)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-green-700" />
              <span>
                <strong>Time:</strong> {formatTime(booking.scheduledTime)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
            <span>
              <strong>Location:</strong> {formatAddress(booking.address)}
            </span>
          </div>

          {/* Vehicle */}
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
            <span>
              <strong>Vehicle:</strong> {booking.vehicle.year}{" "}
              {booking.vehicle.make} {booking.vehicle.model} (
              {booking.vehicle.color})
            </span>
          </div>

          {/* Frequency */}
          {booking.frequency !== "one-time" && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
              <span>
                <strong>Frequency:</strong>{" "}
                {booking.frequency.replace("-", " ")}
              </span>
            </div>
          )}

          {/* Total Amount */}
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
            <span>
              <strong>Total Amount:</strong> ${booking.totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
            <span>
              <strong>Status:</strong>{" "}
              <span className="capitalize">{booking.status}</span>
            </span>
          </div>

          {/* Special Instructions */}
          {booking.specialInstructions && (
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
              <span>
                <strong>Special Instructions:</strong>{" "}
                {booking.specialInstructions}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 mt-6">
          <Link href={`/bookings/${booking._id}`} className="w-1/2">
            <Button
              variant="outline"
              className="rounded-full border-black text-black font-medium w-full"
            >
              Track Booking
            </Button>
          </Link>
          <Link href="/dashboard" className="w-1/2">
            <Button className="w-full rounded-full bg-green-700 text-white font-semibold">
              Go To Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-white border-t md:hidden">
        <div className="max-w-md mx-auto rounded-full bg-white shadow border flex justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center">
            <Home className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Home</span>
          </Link>
          <Link href="/bookings" className="flex flex-col items-center">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-[10px] text-green-600 font-semibold">
              Booking
            </span>
          </Link>
          <Link
            href="/booking"
            className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full -mt-4"
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </Link>
          <Link href="/support" className="flex flex-col items-center">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Chat</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
