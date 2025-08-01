"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { apiService, SupportTicket } from "@/lib/api";
import { toast } from "sonner";
import AdminTicketDetail from "@/components/AdminTicketDetail";

interface TicketStats {
  open: number;
  "in-progress": number;
  resolved: number;
  closed: number;
  total: number;
}

export default function AdminTicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    open: 0,
    "in-progress": 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const response = await apiService.getAdminTickets(
        session.accessToken,
        params
      );

      if (response.success && response.data) {
        setTickets(response.data.tickets);
        setTotalPages(response.data.pagination.pages);
        setTotalTickets(response.data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await apiService.getSupportStats(session.accessToken);

      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    if (session?.accessToken) {
      fetchTickets();
      fetchStats();
    }
  }, [
    session?.accessToken,
    currentPage,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, categoryFilter]);

  // Filter tickets based on search term and active tab
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.user &&
      typeof ticket.user === "object" &&
      "fullName" in ticket.user
        ? ticket.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        : false);

    const matchesTab = activeTab === "all" || ticket.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-3 h-3" />;
      case "in-progress":
        return <Clock className="w-3 h-3" />;
      case "resolved":
        return <CheckCircle className="w-3 h-3" />;
      case "closed":
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLastResponse = (ticket: SupportTicket) => {
    if (ticket.messages && ticket.messages.length > 0) {
      const lastMessage = ticket.messages[ticket.messages.length - 1];
      const date = new Date(lastMessage.createdAt);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return "1 day ago";
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
    return "No responses";
  };

  const getCustomerName = (ticket: SupportTicket) => {
    if (
      ticket.user &&
      typeof ticket.user === "object" &&
      "fullName" in ticket.user
    ) {
      return ticket.user.fullName;
    }
    return "Unknown Customer";
  };

  const getCustomerEmail = (ticket: SupportTicket) => {
    if (
      ticket.user &&
      typeof ticket.user === "object" &&
      "email" in ticket.user
    ) {
      return ticket.user.email;
    }
    return "No email";
  };

  const getAssignedTo = (ticket: SupportTicket) => {
    if (
      ticket.assignedTo &&
      typeof ticket.assignedTo === "object" &&
      "fullName" in ticket.assignedTo
    ) {
      return ticket.assignedTo.fullName;
    }
    return "Unassigned";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-white text-2xl font-bold">Support Tickets</h1>
              <p className="text-white/90">Manage customer support requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                <p className="text-gray-600 text-sm">Open Tickets</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats["in-progress"]}
                </p>
                <p className="text-gray-600 text-sm">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.resolved}
                </p>
                <p className="text-gray-600 text-sm">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {stats.closed}
                </p>
                <p className="text-gray-600 text-sm">Closed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tickets by subject, number, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-10 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48 h-10 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 h-10 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-200 rounded-xl p-1 mb-6">
            <TabsTrigger value="all" className="rounded-lg">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="open" className="rounded-lg">
              Open ({stats.open})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="rounded-lg">
              In Progress ({stats["in-progress"]})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-lg">
              Resolved ({stats.resolved})
            </TabsTrigger>
            <TabsTrigger value="closed" className="rounded-lg">
              Closed ({stats.closed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading tickets...</span>
              </div>
            ) : error ? (
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error loading tickets
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchTickets} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card
                    key={ticket._id}
                    className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">
                                {ticket._id.slice(-6).toUpperCase()}
                              </h3>
                              <Badge
                                className={`${getStatusColor(
                                  ticket.status
                                )} text-xs`}
                              >
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1">
                                  {ticket.status.replace("-", " ")}
                                </span>
                              </Badge>
                              <Badge
                                className={`${getPriorityColor(
                                  ticket.priority
                                )} text-xs`}
                              >
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-900 font-medium mb-1">
                              {ticket.subject}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {getCustomerName(ticket)} •{" "}
                              {getCustomerEmail(ticket)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setDetailOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Category</p>
                          <p className="text-gray-600 capitalize">
                            {ticket.category}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Created</p>
                          <p className="text-gray-600">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Assigned To
                          </p>
                          <p className="text-gray-600">
                            {getAssignedTo(ticket)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Last Response
                          </p>
                          <p className="text-gray-600">
                            {getLastResponse(ticket)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTickets.length === 0 && !loading && (
                  <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No tickets found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search or filter criteria.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTicket && (
        <AdminTicketDetail
          ticket={selectedTicket}
          open={detailOpen}
          onOpenChange={(open: boolean) => {
            setDetailOpen(open);
            if (!open) {
              setSelectedTicket(null);
            }
          }}
          onTicketUpdated={fetchTickets}
        />
      )}
    </div>
  );
}
