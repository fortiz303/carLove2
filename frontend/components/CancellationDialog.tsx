"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  isAdmin?: boolean;
  loading?: boolean;
}

const USER_CANCELLATION_REASONS = [
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "vehicle_unavailable", label: "Vehicle Unavailable" },
  { value: "financial_reasons", label: "Financial Reasons" },
  { value: "found_other_service", label: "Found Other Service" },
  { value: "personal_emergency", label: "Personal Emergency" },
  { value: "weather_conditions", label: "Weather Conditions" },
  { value: "other", label: "Other" },
];

const ADMIN_CANCELLATION_REASONS = [
  { value: "staff_unavailable", label: "Staff Unavailable" },
  { value: "equipment_issues", label: "Equipment Issues" },
  { value: "weather_conditions", label: "Weather Conditions" },
  { value: "location_inaccessible", label: "Location Inaccessible" },
  { value: "safety_concerns", label: "Safety Concerns" },
  { value: "service_not_available", label: "Service Not Available" },
  { value: "customer_request", label: "Customer Request" },
  { value: "other", label: "Other" },
];

export default function CancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  isAdmin = false,
  loading = false,
}: CancellationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  const reasons = isAdmin
    ? ADMIN_CANCELLATION_REASONS
    : USER_CANCELLATION_REASONS;

  const handleConfirm = () => {
    if (!selectedReason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Please provide a custom reason");
      return;
    }

    const finalReason =
      selectedReason === "other" ? customReason : selectedReason;
    onConfirm(
      finalReason,
      selectedReason === "other" ? customReason : undefined
    );
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-sm text-red-800">
                Cancellation Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                {isAdmin
                  ? "Cancelling this booking will notify the customer immediately. You can offer rescheduling as an alternative."
                  : "Cancelling this booking may result in partial or no refund depending on your cancellation policy."}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-3">
              <Label htmlFor="customReason">Custom Reason *</Label>
              <Textarea
                id="customReason"
                placeholder="Please provide details about the cancellation reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={
                loading ||
                !selectedReason ||
                (selectedReason === "other" && !customReason.trim())
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
