"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  MessageCircle,
  Calendar,
  Tag,
  ExternalLink,
} from "lucide-react";
import { apiService, SupportTicket } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface SupportTicketListProps {
  onTicketClick?: (ticket: SupportTicket) => void;
}

export default function SupportTicketList({
  onTicketClick,
}: SupportTicketListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { accessToken } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await apiService.getSupportTickets(accessToken || "");
      if (response.success && response.data?.tickets) {
        setTickets(response.data.tickets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "open":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      case "open":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      booking: "Booking Issue",
      payment: "Payment Problem",
      service: "Service Related",
      technical: "Technical Issue",
      general: "General Inquiry",
      complaint: "Complaint",
      suggestion: "Suggestion",
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchTickets} variant="outline" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No support tickets found</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first ticket to get help
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card
          key={ticket._id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onTicketClick?.(ticket)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {ticket.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {ticket.description}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(ticket.status)}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1 capitalize">
                    {ticket.status === "in-progress"
                      ? "In Progress"
                      : ticket.status}
                  </span>
                </Badge>
                <Badge className={getPriorityColor(ticket.priority)}>
                  <span className="capitalize">{ticket.priority}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatDate(ticket.createdAt)}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {getCategoryLabel(ticket.category)}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {ticket.messages.length} message
                {ticket.messages.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
