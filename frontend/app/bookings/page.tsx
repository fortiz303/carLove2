"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Settings,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Star,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import RescheduleDialog from "@/components/RescheduleDialog";
import CancellationDialog from "@/components/CancellationDialog";
import RatingDialog from "@/components/RatingDialog";
import PrimaryLayout from "@/components/layout/primary";
import { useQuery, useMutation, useQueryClient } from "@/hooks/useReactQuery";

interface BookingService {
  service: {
    _id: string;
    name: string;
    description: string;
  };
  quantity: number;
  price: number;
}

interface Booking {
  _id: string;
  services: BookingService[];
  totalAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status:
    | "pending"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    type: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions?: string;
  rescheduleOffered?: boolean;
  rescheduleAccepted?: boolean;
  cancellationReason?: string;
  rating?: number;
  review?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] =
    useState<Booking | null>(null);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedBookingForCancellation, setSelectedBookingForCancellation] =
    useState<Booking | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] =
    useState<Booking | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query for fetching bookings
  const {
    data: bookingsData,
    isLoading: loading,
    error: queryError,
    refetch: fetchBookings,
  } = useQuery({
    queryKey: ["bookings", session?.accessToken],
    queryFn: () => apiService.getBookings(session!.accessToken),
    enabled: !!session?.accessToken,
    select: (data) => data.data?.bookings || [],
  });

  const bookings = bookingsData || [];
  const error = queryError ? "Failed to load bookings" : null;

  // Mutation for cancelling booking
  const cancelBookingMutation = useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason: string;
    }) => apiService.cancelBooking(bookingId, session!.accessToken, reason),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries(["bookings"]);
        toast.success(response.message || "Booking cancelled successfully");
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    },
    onError: (err) => {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking");
    },
    onSettled: () => {
      setCancellationDialogOpen(false);
      setSelectedBookingForCancellation(null);
    },
  });

  const handleCancel = (booking: Booking) => {
    setSelectedBookingForCancellation(booking);
    setCancellationDialogOpen(true);
  };

  const handleCancellationConfirm = async (
    reason: string,
    customReason?: string
  ) => {
    if (!selectedBookingForCancellation) return;

    const finalReason = customReason || reason;
    cancelBookingMutation.mutate({
      bookingId: selectedBookingForCancellation._id,
      reason: finalReason,
    });
  };

  const handleReschedule = async (bookingId: string) => {
    const booking = bookings.find((b: Booking) => b._id === bookingId);
    if (booking) {
      setSelectedBookingForReschedule(booking);
      setRescheduleDialogOpen(true);
    }
  };

  const handleRescheduleSuccess = () => {
    queryClient.invalidateQueries(["bookings"]);
    setRescheduleDialogOpen(false);
    setSelectedBookingForReschedule(null);
  };

  const handleRate = (booking: Booking) => {
    setSelectedBookingForRating(booking);
    setRatingDialogOpen(true);
  };

  const handleRatingSuccess = () => {
    queryClient.invalidateQueries(["bookings"]);
    setRatingDialogOpen(false);
    setSelectedBookingForRating(null);
  };

  const handleRebook = (booking: Booking) => {
    // Store the booking data in localStorage for the booking page to use
    const rebookData = {
      services: booking.services.map((s) => ({
        service: s.service._id,
        quantity: s.quantity,
        price: s.price,
      })),
      vehicle: booking.vehicle,
      address: booking.address,
      specialInstructions: booking.specialInstructions,
      isRebook: true,
      originalBookingId: booking._id,
    };

    localStorage.setItem("rebookData", JSON.stringify(rebookData));
    router.push("/booking");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-blue-600 border-blue-500";
      case "in-progress":
        return "text-orange-600 border-orange-500";
      case "completed":
        return "text-green-600 border-green-500";
      case "cancelled":
        return "text-red-600 border-red-500";
      case "no-show":
        return "text-gray-600 border-gray-500";
      default:
        return "text-yellow-600 border-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "no-show":
        return "No Show";
      default:
        return "Pending";
    }
  };

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
    const [hours, minutes] = timeString.split(":").map(Number);
    const hour = hours >= 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const getServiceNames = (services: BookingService[]) => {
    return services.map((s) => s.service.name).join(", ");
  };

  // Only show "pending" or "confirmed" bookings in upcoming
  const upcomingBookings = bookings.filter((booking: Booking) =>
    ["pending", "confirmed"].includes(booking.status)
  );

  // Only show "cancelled" or "completed" bookings in past
  const pastBookings = bookings.filter((booking: Booking) =>
    ["cancelled", "completed"].includes(booking.status)
  );

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking._id} className="rounded-xl border mb-4 shadow-sm">
      <CardContent className="p-4 relative">
        {/* Status badge */}
        <div className="absolute top-3 right-4">
          <span
            className={`text-xs border px-2 py-[2px] rounded-full font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusText(booking.status)}
          </span>
        </div>

        {/* Booking Info */}
        <div className="space-y-2 text-sm text-gray-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-green-700" />
            <p>
              <span className="font-semibold">Service:</span>{" "}
              {getServiceNames(booking.services)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-700" />
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {formatDate(booking.scheduledDate)} –{" "}
              {formatTime(booking.scheduledTime)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-700" />
            <p>
              <span className="font-semibold">Location:</span>{" "}
              {booking.address.street}, {booking.address.city}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Vehicle:</span>{" "}
            {booking.vehicle.year} {booking.vehicle.make}{" "}
            {booking.vehicle.model}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total:</span> $
            {booking.totalAmount.toFixed(2)}
          </div>

          {/* Pending booking notice */}
          {booking.status === "pending" && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-medium text-xs">
                    Awaiting Confirmation
                  </p>
                  <p className="text-yellow-700 text-xs">
                    Your booking is being reviewed. You can cancel anytime
                    before confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation reason and reschedule offer */}
          {booking.status === "cancelled" && booking.cancellationReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium text-xs">
                    Cancellation Reason:
                  </p>
                  <p className="text-red-700 text-xs">
                    {booking.cancellationReason}
                  </p>
                </div>
              </div>

              {booking.rescheduleOffered && !booking.rescheduleAccepted && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium text-xs">
                        Reschedule Available
                      </p>
                      <p className="text-green-700 text-xs">
                        Would you like to reschedule this appointment?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review display */}
          {booking.status === "completed" &&
            booking.rating &&
            booking.review && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium text-xs">
                      Your Review:
                    </p>
                    <p className="text-blue-700 text-xs">{booking.review}</p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <Link href={`/bookings/${booking._id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full border-gray-300 text-gray-700 font-semibold"
            >
              View Details
            </Button>
          </Link>

          {(booking.status === "confirmed" || booking.status === "pending") && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full border-black text-black font-semibold"
              onClick={() => handleCancel(booking)}
            >
              Cancel
            </Button>
          )}

          {booking.status === "cancelled" &&
            booking.rescheduleOffered &&
            !booking.rescheduleAccepted && (
              <Button
                size="sm"
                className="flex-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-full"
                onClick={() => handleReschedule(booking._id)}
                disabled={rescheduling === booking._id}
              >
                {rescheduling === booking._id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CalendarDays className="w-4 h-4 mr-2" />
                )}
                Reschedule
              </Button>
            )}

          {booking.status === "completed" && !booking.rating && (
            <Button
              size="sm"
              className="flex-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-full"
              onClick={() => handleRate(booking)}
            >
              Rate Service
            </Button>
          )}

          {booking.status === "completed" && booking.rating && (
            <div className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600">
              <span>Rated:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= booking.rating!
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {booking.status === "completed" && (
            <Button
              size="sm"
              className="flex-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-full"
              onClick={() => handleRebook(booking)}
            >
              Rebook
            </Button>
          )}

          {booking.status === "cancelled" && !booking.rescheduleOffered && (
            <Button
              size="sm"
              className="flex-1 bg-green-800 hover:bg-green-900 text-white font-semibold rounded-full"
              onClick={() => handleRebook(booking)}
            >
              Rebook
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => fetchBookings()}
            className="bg-green-600 hover:bg-green-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PrimaryLayout>
      {/* Header */}
      <div className="bg-green-600 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-white/90">
            Manage your car detailing appointments
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl p-1 shadow-sm">
            <TabsTrigger
              value="upcoming"
              className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(renderBookingCard)
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No upcoming bookings
                </h3>
                <p className="text-gray-600 mb-6">
                  You don't have any upcoming appointments.
                </p>
                <Button
                  onClick={() => router.push("/book-appointment?step=service")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Book Now
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastBookings.length > 0 ? (
              <div>
                {/* Rating reminder for completed bookings without ratings */}
                {pastBookings.filter(
                  (booking: Booking) =>
                    booking.status === "completed" && !booking.rating
                ).length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-medium text-sm">
                          Rate Your Experience
                        </p>
                        <p className="text-yellow-700 text-sm">
                          Help us improve by rating your completed services.
                          Your feedback is valuable to us!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {pastBookings.map(renderBookingCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No past bookings
                </h3>
                <p className="text-gray-600">
                  You haven't completed any appointments yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reschedule Dialog */}
      {selectedBookingForReschedule && (
        <RescheduleDialog
          isOpen={rescheduleDialogOpen}
          onClose={() => {
            setRescheduleDialogOpen(false);
            setSelectedBookingForReschedule(null);
          }}
          booking={selectedBookingForReschedule}
          accessToken={session!.accessToken}
          onRescheduled={handleRescheduleSuccess}
        />
      )}

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={cancellationDialogOpen}
        onClose={() => {
          setCancellationDialogOpen(false);
          setSelectedBookingForCancellation(null);
        }}
        onConfirm={handleCancellationConfirm}
        isAdmin={false}
        loading={false}
      />

      {/* Rating Dialog */}
      {selectedBookingForRating && (
        <RatingDialog
          isOpen={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
            setSelectedBookingForRating(null);
          }}
          booking={selectedBookingForRating}
          accessToken={session!.accessToken}
          onRated={handleRatingSuccess}
        />
      )}
    </PrimaryLayout>
  );
}
