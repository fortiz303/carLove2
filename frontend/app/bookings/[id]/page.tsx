"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
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
  Car,
  DollarSign,
  User,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import RescheduleDialog from "@/components/RescheduleDialog";
import CancellationDialog from "@/components/CancellationDialog";
import RatingDialog from "@/components/RatingDialog";
import PrimaryLayout from "@/components/layout/primary";

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

export default function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.accessToken) {
      fetchBooking();
    }
  }, [session]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBooking(
        params.id,
        session!.accessToken
      );

      if (response.success) {
        setBooking(response.data.booking);
      } else {
        setError(response.message || "Failed to fetch booking");
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCancellationDialogOpen(true);
  };

  const handleCancellationConfirm = async (
    reason: string,
    customReason?: string
  ) => {
    if (!booking) return;

    const finalReason = customReason || reason;
    try {
      const response = await apiService.cancelBooking(
        booking._id,
        session!.accessToken,
        finalReason
      );

      if (response.success) {
        toast.success(response.message || "Booking cancelled successfully");
        await fetchBooking();
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking");
    } finally {
      setCancellationDialogOpen(false);
    }
  };

  const handleReschedule = () => {
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSuccess = async () => {
    await fetchBooking();
    setRescheduleDialogOpen(false);
    toast.success("Booking rescheduled successfully");
  };

  const handleRate = () => {
    setRatingDialogOpen(true);
  };

  const handleRatingSuccess = async () => {
    await fetchBooking();
    setRatingDialogOpen(false);
    toast.success("Thank you for your review!");
  };

  const handleRebook = () => {
    if (!booking) return;

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
    router.push("/book-appointment?step=service");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in-progress":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "no-show":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
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

  if (loading) {
    return (
      <PrimaryLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </PrimaryLayout>
    );
  }

  if (error || !booking) {
    return (
      <PrimaryLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Booking not found"}</p>
            <Button
              onClick={() => router.push("/bookings")}
              className="bg-green-600 hover:bg-green-700"
            >
              Back to Bookings
            </Button>
          </div>
        </div>
      </PrimaryLayout>
    );
  }

  return (
    <PrimaryLayout>
      {/* Header */}
      <div className="bg-green-600 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/bookings">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-white text-2xl font-bold">
                  Booking #{booking._id.slice(-6)}
                </h1>
                <Badge className={`${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </Badge>
              </div>
              <p className="text-white/90">Booking details and actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {getServiceNames(booking.services)}
                  </h3>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Duration: {booking.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-green-600">
                        ${booking.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {booking.specialInstructions && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">
                      Special Instructions:
                    </h4>
                    <p className="text-blue-700 text-sm">
                      {booking.specialInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Date & Time
                    </h4>
                    <p className="text-lg font-semibold">
                      {formatDate(booking.scheduledDate)}
                    </p>
                    <p className="text-gray-600">
                      {formatTime(booking.scheduledTime)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Location</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{booking.address.street}</p>
                        <p className="text-gray-600">
                          {booking.address.city}, {booking.address.state}{" "}
                          {booking.address.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Vehicle</h4>
                    <p className="text-lg font-semibold">
                      {booking.vehicle.year} {booking.vehicle.make}{" "}
                      {booking.vehicle.model}
                    </p>
                    <p className="text-gray-600 capitalize">
                      {booking.vehicle.type}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Color</h4>
                    <p className="text-lg font-semibold capitalize">
                      {booking.vehicle.color}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Notifications */}
            {booking.status === "pending" && (
              <Card className="rounded-2xl shadow-sm border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">
                        Awaiting Confirmation
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        Your booking is being reviewed by our team. You can
                        cancel anytime before confirmation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.status === "cancelled" && booking.cancellationReason && (
              <Card className="rounded-2xl shadow-sm border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">
                        Cancellation Reason:
                      </h4>
                      <p className="text-red-700 text-sm">
                        {booking.cancellationReason}
                      </p>
                    </div>
                  </div>

                  {booking.rescheduleOffered && !booking.rescheduleAccepted && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
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
                </CardContent>
              </Card>
            )}

            {booking.status === "completed" &&
              booking.rating &&
              booking.review && (
                <Card className="rounded-2xl shadow-sm border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">
                          Your Review:
                        </h4>
                        <div className="flex items-center gap-1 mb-2">
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
                        <p className="text-blue-700 text-sm">
                          {booking.review}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(booking.status === "confirmed" ||
                  booking.status === "pending") && (
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-red-500 text-red-600 hover:bg-red-50"
                    onClick={handleCancel}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}

                {booking.status === "cancelled" &&
                  booking.rescheduleOffered &&
                  !booking.rescheduleAccepted && (
                    <Button
                      className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleReschedule}
                      disabled={rescheduling}
                    >
                      {rescheduling ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CalendarDays className="w-4 h-4 mr-2" />
                      )}
                      Reschedule
                    </Button>
                  )}

                {booking.status === "completed" && !booking.rating && (
                  <Button
                    className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleRate}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Service
                  </Button>
                )}

                {(booking.status === "completed" ||
                  (booking.status === "cancelled" &&
                    !booking.rescheduleOffered)) && (
                  <Button
                    className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleRebook}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Rebook Service
                  </Button>
                )}

                <Link href="/support">
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Get Support
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{booking._id.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-green-600">
                    ${booking.totalAmount.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="text-center">
                  <Badge className={`${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      {booking && (
        <RescheduleDialog
          isOpen={rescheduleDialogOpen}
          onClose={() => setRescheduleDialogOpen(false)}
          booking={booking}
          accessToken={session!.accessToken}
          onRescheduled={handleRescheduleSuccess}
        />
      )}

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={cancellationDialogOpen}
        onClose={() => setCancellationDialogOpen(false)}
        onConfirm={handleCancellationConfirm}
        isAdmin={false}
        loading={false}
      />

      {/* Rating Dialog */}
      {booking && (
        <RatingDialog
          isOpen={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          booking={booking}
          accessToken={session!.accessToken}
          onRated={handleRatingSuccess}
        />
      )}
    </PrimaryLayout>
  );
}
