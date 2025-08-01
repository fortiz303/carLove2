"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiService } from "@/lib/api";
import { useQuery } from "@/hooks/useReactQuery";

interface BookingService {
  service: {
    _id: string;
    name: string;
    category: string;
    basePrice: number;
  };
  quantity: number;
  price: number;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  user: string;
  services: BookingService[];
  scheduledDate: string;
  scheduledTime: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  createdAt: string;
}

export default function DashboardServicesList() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: session } = useSession();

  // Use React Query to fetch bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["dashboard-bookings", session?.accessToken],
    queryFn: async () => {
      if (!session?.accessToken) {
        throw new Error("No access token available");
      }
      const response = await apiService.getBookings(session.accessToken);

      if (response.success) {
        // Filter only upcoming bookings for the dashboard
        const upcomingBookings = (response.data.bookings || []).filter(
          (booking: Booking) => {
            const bookingDate = new Date(booking.scheduledDate);
            const now = new Date();
            return (
              bookingDate >= now &&
              booking.status !== "completed" &&
              booking.status !== "cancelled"
            );
          }
        );
        return upcomingBookings.slice(0, 6); // Limit to 6 bookings for dashboard
      }
      throw new Error("Failed to fetch bookings");
    },
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const bookings = bookingsData || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getServiceNames = (services: BookingService[]) => {
    return services.map((s) => s.service.name).join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  const totalSlides = Math.ceil(bookings.length / 2);
  const canGoLeft = currentSlide > 0;
  const canGoRight = currentSlide < totalSlides - 1;

  const nextSlide = () => {
    if (canGoRight) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (canGoLeft) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Services</h3>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden rounded-xl shadow-md">
              <CardContent className="p-0">
                <div className="h-28 bg-gray-200 animate-pulse"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="px-4 mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Recent Bookings
        </h3>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-2">📅</div>
            <p className="text-gray-600 text-sm">No upcoming bookings</p>
            <p className="text-gray-500 text-xs mt-1">
              Book your first service to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Recent Bookings</h3>
        {bookings.length > 2 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={!canGoLeft}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {currentSlide + 1} / {totalSlides}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={!canGoRight}
              className="p-1 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {Array.from({ length: totalSlides }, (_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-2 gap-4">
                {bookings
                  .slice(slideIndex * 2, slideIndex * 2 + 2)
                  .map((booking: Booking) => (
                    <Link
                      key={booking._id}
                      href={`/bookings/${booking._id}`}
                      className="block"
                    >
                      <Card className="overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-lg cursor-pointer">
                        <CardContent className="p-0">
                          <div className="relative h-28 bg-gradient-to-br from-green-50 to-green-100">
                            <div className="absolute top-2 right-2">
                              <Badge
                                className={`text-[10px] px-2 py-[2px] rounded-full shadow ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {getStatusText(booking.status)}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2 text-[10px] text-gray-600 font-medium">
                              {formatDate(booking.scheduledDate)}
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-xs sm:text-sm truncate mb-2">
                              {getServiceNames(booking.services)}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(booking.scheduledTime)}
                              </div>

                              <div className="flex items-center text-green-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-600 mr-1"></span>
                                <span className="text-[10px] sm:text-xs">
                                  ${booking.totalAmount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Button */}
      <Button
        className="w-full h-12 bg-green-700 hover:bg-green-800 text-white rounded-full font-semibold mt-6 shadow-md"
        asChild
      >
        <Link href="/book-appointment?step=service">Book A New Service</Link>
      </Button>
    </div>
  );
}
