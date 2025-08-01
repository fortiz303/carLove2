"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  MessageCircle,
  Calendar,
  Tag,
  User,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { apiService, SupportTicket, TicketResponse } from "@/lib/api";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface AdminTicketDetailProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: () => void;
}

export default function AdminTicketDetail({
  ticket,
  open,
  onOpenChange,
  onTicketUpdated,
}: AdminTicketDetailProps) {
  const { data: session } = useSession();

  // Debug session
  console.log("AdminTicketDetail - Session:", session);
  console.log("AdminTicketDetail - Ticket:", ticket);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit response called");
    console.log("Ticket:", ticket?._id);
    console.log("Response:", response);
    console.log("Session:", session?.accessToken ? "Has token" : "No token");

    if (!ticket || !response.trim() || !session?.accessToken) {
      console.log("Validation failed");
      if (!ticket) console.log("No ticket");
      if (!response.trim()) console.log("No response content");
      if (!session?.accessToken) console.log("No access token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const responseData: TicketResponse = {
        content: response.trim(),
      };

      console.log("Sending response data:", responseData);

      const result = await apiService.respondToTicket(
        ticket._id,
        responseData,
        session.accessToken
      );

      console.log("Response result:", result);

      setResponse("");
      onTicketUpdated?.();
      toast.success("Response sent successfully");
    } catch (err) {
      console.error("Error in handleSubmitResponse:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send response";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket || !session?.accessToken) return;

    setLoading(true);
    setError("");

    try {
      await apiService.closeTicket(ticket._id, session.accessToken);
      onTicketUpdated?.();
      onOpenChange(false);
      toast.success("Ticket closed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to close ticket";
      setError(errorMessage);
      toast.error(errorMessage);
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
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Support Ticket</span>
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusIcon(ticket.status)}
              <span className="ml-1 capitalize">
                {ticket.status === "in-progress"
                  ? "In Progress"
                  : ticket.status}
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Ticket #{ticket._id.slice(-8).toUpperCase()} -{" "}
            {getCustomerName(ticket)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Customer Information */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>{" "}
                {getCustomerName(ticket)}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                {getCustomerEmail(ticket)}
              </div>
              <div>
                <span className="font-medium">Assigned To:</span>{" "}
                {getAssignedTo(ticket)}
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {formatDate(ticket.createdAt)}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{ticket.subject}</h3>
              <p className="text-gray-600 mt-1">{ticket.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(ticket.priority)}>
                <span className="capitalize">{ticket.priority} Priority</span>
              </Badge>
              <Badge variant="outline">
                <Tag className="w-3 h-3 mr-1" />
                {getCategoryLabel(ticket.category)}
              </Badge>
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(ticket.createdAt)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Messages */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Messages ({ticket.messages.length})
            </h4>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {ticket.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.isInternal
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {message.isInternal ? "Internal Note" : "Customer"}
                      </span>
                      {message.isInternal && (
                        <Badge variant="outline" className="text-xs">
                          Internal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution */}
          {ticket.resolution && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">Resolution</h4>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{ticket.resolution}</p>
                  {ticket.resolvedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Resolved on {formatDate(ticket.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add Response */}
          {
            <>
              <Separator />
              <div className="p-3 bg-blue-50 rounded-lg mb-3">
                <p className="text-sm text-blue-700">
                  <strong>Ticket Status:</strong>{" "}
                  {ticket.status.charAt(0).toUpperCase() +
                    ticket.status.slice(1)}
                  {ticket.status === "closed" &&
                    " - You can still add internal notes"}
                </p>
              </div>
              <form onSubmit={handleSubmitResponse} className="space-y-3">
                <div>
                  <Label htmlFor="response">Add Response</Label>
                  <Textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={
                      ticket.status === "closed"
                        ? "Type internal note..."
                        : "Type your response..."
                    }
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !response.trim()}
                    className="flex-1"
                  >
                    {loading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <Send className="w-4 h-4 mr-2" />
                    {ticket.status === "closed"
                      ? "Add Internal Note"
                      : "Send Response"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseTicket}
                    disabled={loading}
                  >
                    Close Ticket
                  </Button>
                </div>
              </form>
            </>
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
