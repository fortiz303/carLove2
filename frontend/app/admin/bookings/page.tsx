"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import CancellationDialog from "@/components/CancellationDialog";

interface Booking {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  services: Array<{
    service: {
      _id: string;
      name: string;
      category: string;
    };
    quantity: number;
    price: number;
  }>;
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
  totalAmount: number;
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
  payment: {
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
  };
  assignedStaff?: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedBookingForCancellation, setSelectedBookingForCancellation] =
    useState<Booking | null>(null);
  const { data: session } = useSession();

  const testConnection = async () => {
    try {
      console.log("Testing admin connection...");
      const testResponse = await apiService.testAdminBookings(
        session!.accessToken
      );
      console.log("Test response:", testResponse);
    } catch (error) {
      console.error("Test connection error:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("Fetching admin bookings...");
      console.log("Session:", session);
      console.log("Access token:", session?.accessToken);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      console.log("Params:", params.toString());

      const response = await apiService.getAdminBookings(
        session!.accessToken,
        params.toString()
      );

      console.log("API Response:", response);

      if (response.success) {
        setBookings(response.data.bookings || []);
        console.log("Bookings set:", response.data.bookings);
      } else {
        console.error("API Error:", response.message);
        toast.error(response.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Session changed:", session);
    console.log("Session user:", session?.user);
    console.log("Session access token:", session?.accessToken);

    if (session?.accessToken) {
      // Check if user is admin
      if (session.user?.role === "admin") {
        setIsAdmin(true);
        testConnection();
        fetchBookings();
      } else {
        console.error("User is not admin:", session.user?.role);
        toast.error("Access denied. Admin privileges required.");
      }
    }
  }, [session, statusFilter, searchTerm]);

  // If not admin, show access denied
  if (session && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setProcessing(bookingId);
      const response = await apiService.acceptBooking(
        bookingId,
        session!.accessToken
      );

      if (response.success) {
        toast.success("Booking accepted successfully");
        await fetchBookings();
      } else {
        toast.error(response.message || "Failed to accept booking");
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast.error("Failed to accept booking");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectBooking = (booking: Booking) => {
    setSelectedBookingForCancellation(booking);
    setCancellationDialogOpen(true);
  };

  const handleRejectionConfirm = async (
    reason: string,
    customReason?: string
  ) => {
    if (!selectedBookingForCancellation) return;

    try {
      setProcessing(selectedBookingForCancellation._id);
      const finalReason = customReason || reason;

      const response = await apiService.rejectBooking(
        selectedBookingForCancellation._id,
        finalReason,
        session!.accessToken
      );

      if (response.success) {
        toast.success("Booking rejected successfully");
        await fetchBookings();
      } else {
        toast.error(response.message || "Failed to reject booking");
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Failed to reject booking");
    } finally {
      setProcessing(null);
      setCancellationDialogOpen(false);
      setSelectedBookingForCancellation(null);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBookingForCancellation(booking);
    setCancellationDialogOpen(true);
  };

  const handleCancellationConfirm = async (
    reason: string,
    customReason?: string
  ) => {
    if (!selectedBookingForCancellation) return;

    try {
      setProcessing(selectedBookingForCancellation._id);
      const finalReason = customReason || reason;

      const offerReschedule = confirm("Would you like to offer rescheduling?");

      const response = await apiService.adminCancelBooking(
        selectedBookingForCancellation._id,
        finalReason,
        offerReschedule,
        session!.accessToken
      );

      if (response.success) {
        toast.success("Booking cancelled successfully");
        await fetchBookings();
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setProcessing(null);
      setCancellationDialogOpen(false);
      setSelectedBookingForCancellation(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "in-progress":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "in-progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
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

  const getServiceNames = (services: Booking["services"]) => {
    return services.map((s) => s.service.name).join(", ");
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesTab = activeTab === "all" || booking.status === activeTab;
    return matchesTab;
  });

  const getTabCount = (status: string) => {
    if (status === "all") return bookings.length;
    return bookings.filter((b) => b.status === status).length;
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-white text-3xl font-bold">
                Bookings Management
              </h1>
              <p className="text-white/90 mt-1">
                Manage and review all bookings
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name, email, or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{getTabCount("pending")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold">
                    {getTabCount("confirmed")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {getTabCount("in-progress")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {getTabCount("completed")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 bg-white rounded-2xl p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-xl">
              All ({getTabCount("all")})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl">
              Pending ({getTabCount("pending")})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-xl">
              Confirmed ({getTabCount("confirmed")})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="rounded-xl">
              In Progress ({getTabCount("in-progress")})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl">
              Completed ({getTabCount("completed")})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-xl">
              Cancelled ({getTabCount("cancelled")})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card
                  key={booking._id}
                  className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              #{booking._id.slice(-6)}
                            </h3>
                            <Badge
                              className={`${getStatusColor(
                                booking.status
                              )} text-xs`}
                            >
                              {getStatusText(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-600">
                            {getServiceNames(booking.services)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/admin/bookings/${booking._id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>

                        {/* Action buttons based on status */}
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAcceptBooking(booking._id)}
                              disabled={processing === booking._id}
                            >
                              {processing === booking._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectBooking(booking)}
                              disabled={processing === booking._id}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {(booking.status === "confirmed" ||
                          booking.status === "in-progress") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancelBooking(booking)}
                            disabled={processing === booking._id}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{booking.user.fullName}</p>
                          <p className="text-gray-600">{booking.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {formatDate(booking.scheduledDate)}
                          </p>
                          <p className="text-gray-600">
                            {formatTime(booking.scheduledTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {booking.address.city}, {booking.address.state}
                          </p>
                          <p className="text-gray-600">
                            {booking.vehicle.year} {booking.vehicle.make}{" "}
                            {booking.vehicle.model}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            ${booking.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-gray-600 capitalize">
                            {booking.payment.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No bookings found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={cancellationDialogOpen}
        onClose={() => {
          setCancellationDialogOpen(false);
          setSelectedBookingForCancellation(null);
        }}
        onConfirm={
          selectedBookingForCancellation?.status === "pending"
            ? handleRejectionConfirm
            : handleCancellationConfirm
        }
        isAdmin={true}
        loading={processing !== null}
      />
    </div>
  );
}
