"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  Calendar,
  XCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.accessToken) return;

      try {
        setLoading(true);
        const response = await apiService.getAdminDashboardStats(
          session.accessToken
        );
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.message || "Failed to fetch dashboard data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.accessToken]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use real data or fallback to empty values
  const stats = {
    totalUsers: dashboardData?.totalUsers || 0,
    totalBookings: dashboardData?.totalBookings || 0,
    cancelledBookings: dashboardData?.bookingStatusBreakdown?.cancelled || 0,
    completedBookings: dashboardData?.bookingStatusBreakdown?.completed || 0,
    pendingBookings: dashboardData?.bookingStatusBreakdown?.pending || 0,
    totalRevenue: dashboardData?.totalRevenue || 0,
  };

  const bookingStatusData = [
    { name: "Completed", value: stats.completedBookings, color: "#16a34a" },
    { name: "Pending", value: stats.pendingBookings, color: "#eab308" },
    { name: "Cancelled", value: stats.cancelledBookings, color: "#dc2626" },
  ].filter((item) => item.value > 0);

  const monthlyBookingsData = dashboardData?.monthlyBookings || [];

  const recentBookings = dashboardData?.recentBookings || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-white text-3xl font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-white/90">
            CARLOVE Car Detailing - Management Overview
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalBookings.toLocaleString()}
                  </p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-green-600 text-sm flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +15% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Link
                href="/admin/bookings"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {booking.id}
                        </span>
                        <Badge
                          className={`${getStatusColor(
                            booking.status
                          )} text-xs`}
                        >
                          {booking.status === "completed" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {booking.status === "pending" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {booking.status === "cancelled" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {booking.customer}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.service} • {booking.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${booking.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/bookings">
                  <div className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                    <Calendar className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Manage Bookings
                    </h3>
                    <p className="text-sm text-gray-600">
                      View and manage all bookings
                    </p>
                  </div>
                </Link>

                <Link href="/admin/tickets">
                  <div className="p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer">
                    <Clock className="w-8 h-8 text-yellow-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">
                      Support Tickets
                    </h3>
                    <p className="text-sm text-gray-600">
                      Handle customer support
                    </p>
                  </div>
                </Link>

                <Link href="/admin/promo-codes">
                  <div className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
                    <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Promo Codes</h3>
                    <p className="text-sm text-gray-600">
                      Manage discount codes
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
