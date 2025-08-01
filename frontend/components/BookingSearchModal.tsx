"use client";

import { Search, Calendar, MapPin, Car, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useBookingSearch } from "@/hooks/useBookingSearch";

interface BookingService {
  service: {
    _id: string;
    name: string;
  };
}

interface BookingSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "in-progress":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "no-show":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return "⏳";
    case "confirmed":
      return "✅";
    case "in-progress":
      return "🔄";
    case "completed":
      return "🎉";
    case "cancelled":
      return "❌";
    case "no-show":
      return "🚫";
    default:
      return "📋";
  }
};

export default function BookingSearchModal({
  isOpen,
  onClose,
}: BookingSearchModalProps) {
  const { bookings, searchQuery, setSearchQuery, loading, searchStats } =
    useBookingSearch();

  // Ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[80vh] overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Bookings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by vehicle, address, service, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : safeBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "No bookings found matching your search."
                  : "No bookings available."}
              </div>
            ) : (
              safeBookings.map((booking) => (
                <Card
                  key={booking._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(booking.status)}>
                            <span className="mr-1">
                              {getStatusIcon(booking.status)}
                            </span>
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ID: {booking._id.slice(-8)}
                          </span>
                        </div>

                        {/* Vehicle Info */}
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {booking.vehicle.year} {booking.vehicle.make}{" "}
                            {booking.vehicle.model}
                          </span>
                          <span className="text-gray-500">
                            ({booking.vehicle.color})
                          </span>
                        </div>

                        {/* Services */}
                        <div className="text-sm">
                          <span className="font-medium">Services: </span>
                          {booking.services.map(
                            (service: BookingService, index: number) => (
                              <span key={service.service._id}>
                                {service.service.name}
                                {index < booking.services.length - 1
                                  ? ", "
                                  : ""}
                              </span>
                            )
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.scheduledDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(booking.scheduledTime)}
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {booking.address.street}, {booking.address.city},{" "}
                            {booking.address.state} {booking.address.zipCode}
                          </span>
                        </div>

                        {/* Total Amount */}
                        <div className="text-sm">
                          <span className="font-medium">Total: </span>
                          <span className="text-green-600 font-semibold">
                            ${booking.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col gap-2">
                        <Link href={`/bookings`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-gray-500">
              {safeBookings.length} booking
              {safeBookings.length !== 1 ? "s" : ""} found
            </span>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
