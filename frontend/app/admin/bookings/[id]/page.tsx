"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  Loader2,
  Car,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import CancellationDialog from "@/components/CancellationDialog";

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
    licensePlate?: string;
    vin?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  specialInstructions?: string;
  completionNotes?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
        resolvedParams.id,
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

  const handleComplete = async () => {
    if (!booking) return;

    try {
      setCompleting(true);
      const response = await apiService.completeBooking(
        booking._id,
        completionNotes,
        session!.accessToken
      );

      if (response.success) {
        toast.success("Booking marked as completed successfully");
        setCompletionDialogOpen(false);
        setCompletionNotes("");
        await fetchBooking(); // Refresh the booking data
      } else {
        toast.error(response.message || "Failed to complete booking");
      }
    } catch (err) {
      console.error("Error completing booking:", err);
      toast.error("Failed to complete booking");
    } finally {
      setCompleting(false);
    }
  };

  const handleAdminCancel = async (reason: string, customReason?: string) => {
    if (!booking) return;
    try {
      setCancelling(true);
      const response = await apiService.adminCancelBooking(
        booking._id,
        customReason || reason,
        false, // offerReschedule
        session!.accessToken
      );
      if (response.success) {
        toast.success("Booking cancelled successfully");
        setCancellationDialogOpen(false);
        await fetchBooking();
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error("Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      setConfirming(true);
      const response = await apiService.acceptBooking(
        booking._id,
        session!.accessToken
      );
      if (response.success) {
        toast.success("Booking confirmed successfully");
        await fetchBooking();
      } else {
        toast.error(response.message || "Failed to confirm booking");
      }
    } catch (err) {
      console.error("Error confirming booking:", err);
      toast.error("Failed to confirm booking");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "no-show":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  const getServiceNames = (services: BookingService[]) => {
    return services.map((s) => s.service.name).join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Booking not found"}</p>
          <Button
            onClick={() => router.push("/admin/bookings")}
            className="bg-green-600 hover:bg-green-700"
          >
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/bookings">
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
                  {booking.status.replace("-", " ")}
                </Badge>
              </div>
              <p className="text-white/90">Booking details and management</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-red-500/10 border-red-300/20 text-red-100 hover:bg-red-500/20"
                onClick={() => setCancellationDialogOpen(true)}
                disabled={
                  booking.status === "cancelled" ||
                  booking.status === "completed"
                }
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                      {getInitials(booking.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {booking.user.fullName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {booking.user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {booking.user.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {booking.vehicle.year} {booking.vehicle.make}{" "}
                      {booking.vehicle.model}
                    </h3>
                    <p className="text-gray-600 capitalize">
                      {booking.vehicle.type}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Make:
                        </span>
                        <span className="font-semibold">
                          {booking.vehicle.make}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Model:
                        </span>
                        <span className="font-semibold">
                          {booking.vehicle.model}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Year:
                        </span>
                        <span className="font-semibold">
                          {booking.vehicle.year}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Color:
                        </span>
                        <span className="font-semibold">
                          {booking.vehicle.color}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Type:
                        </span>
                        <span className="font-semibold capitalize">
                          {booking.vehicle.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          License Plate:
                        </span>
                        <span className="font-semibold">
                          {booking.vehicle.licensePlate ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {booking.vehicle.licensePlate}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {booking.vehicle.vin && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          VIN:
                        </span>
                        <span className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border">
                          {booking.vehicle.vin}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Completion Notes */}
            {booking.status === "completed" && booking.completionNotes && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Completion Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{booking.completionNotes}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Completed on {formatDate(booking.completedAt!)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.status === "pending" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                )}

                {booking.status !== "completed" &&
                  booking.status !== "cancelled" && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setCompletionDialogOpen(true)}
                    >
                      Mark as Completed
                    </Button>
                  )}

                {booking.status !== "cancelled" &&
                  booking.status !== "completed" && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                      onClick={() => setCancellationDialogOpen(true)}
                    >
                      Cancel Booking
                    </Button>
                  )}
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Booking Created</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>
                {booking.status === "completed" && booking.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Service Completed</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.completedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {booking.status === "completed" && booking.rating && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Customer Review</p>
                      <p className="text-xs text-gray-500">
                        {booking.reviewedAt && formatDate(booking.reviewedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Rating */}
            {booking.status === "completed" && booking.rating && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Customer Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= booking.rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">
                      {booking.rating}/5
                    </span>
                  </div>

                  {booking.review && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Customer Review
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        "{booking.review}"
                      </p>
                    </div>
                  )}

                  {booking.reviewedAt && (
                    <p className="text-xs text-gray-500">
                      Reviewed on {formatDate(booking.reviewedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Rating Notice */}
            {booking.status === "completed" && !booking.rating && (
              <Card className="rounded-2xl shadow-sm border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Awaiting Customer Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700 text-sm">
                    This booking has been completed but the customer hasn't left
                    a review yet.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Completion Notes */}
            {booking.status === "completed" && booking.completionNotes && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Completion Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {booking.completionNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Summary */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-lg text-gray-800">
                    {booking.vehicle.year} {booking.vehicle.make}
                  </h4>
                  <p className="text-gray-600 font-medium">
                    {booking.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {booking.vehicle.type}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium">{booking.vehicle.color}</span>
                  </div>
                  {booking.vehicle.licensePlate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">License:</span>
                      <span className="font-medium text-blue-600">
                        {booking.vehicle.licensePlate}
                      </span>
                    </div>
                  )}
                  {booking.vehicle.vin && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-mono text-xs">
                        {booking.vehicle.vin.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-semibold">
                    ${booking.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">$0</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-green-600">
                    ${booking.totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Rating Summary */}
            {booking.status === "completed" && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Customer Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.rating ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
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
                        <span className="font-semibold text-gray-700">
                          {booking.rating}/5
                        </span>
                      </div>
                      {booking.review && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">Review:</p>
                          <p className="text-xs leading-relaxed">
                            "
                            {booking.review.length > 100
                              ? `${booking.review.substring(0, 100)}...`
                              : booking.review}
                            "
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No rating yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Mark as Completed
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="completionNotes">
                Completion Notes (Optional)
              </Label>
              <Textarea
                id="completionNotes"
                placeholder="Add any notes about the completed service..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCompletionDialogOpen(false);
                  setCompletionNotes("");
                }}
                className="flex-1"
                disabled={completing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={completing}
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CancellationDialog
        isOpen={cancellationDialogOpen}
        onClose={() => setCancellationDialogOpen(false)}
        onConfirm={handleAdminCancel}
        isAdmin
        loading={cancelling}
      />
    </div>
  );
}
