"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  MapPin,
  Settings,
  Loader2,
  Check,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    _id: string;
    services: Array<{
      service: {
        name: string;
      };
      quantity: number;
      price: number;
    }>;
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    vehicle: {
      year: number;
      make: string;
      model: string;
    };
    totalAmount: number;
  };
  accessToken: string;
  onRescheduled: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export default function RescheduleDialog({
  isOpen,
  onClose,
  booking,
  accessToken,
  onRescheduled,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchAvailableSlots();
    }
  }, [isOpen, selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);
      const response = await apiService.getRescheduleSlots(
        booking._id,
        selectedDate.toISOString().split("T")[0],
        booking.duration,
        accessToken
      );

      if (response.success) {
        setAvailableSlots(response.data.availableSlots || []);
      } else {
        toast.error("Failed to fetch available time slots");
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.rescheduleBooking(
        booking._id,
        selectedDate.toISOString().split("T")[0],
        selectedTime,
        accessToken
      );

      if (response.success) {
        toast.success("Reschedule request sent! Awaiting admin approval.");
        onRescheduled();
        onClose();
      } else {
        toast.error(response.message || "Failed to reschedule booking");
      }
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast.error("Failed to reschedule booking");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const hour = hours >= 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour || 12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const getServiceNames = () => {
    return booking.services.map((s) => s.service.name).join(", ");
  };

  const disabledDates = {
    before: new Date(),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-green-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Booking Info */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-sm text-orange-800">
                Original Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">{getServiceNames()}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-600" />
                <span className="text-sm">
                  {new Date(booking.scheduledDate).toLocaleDateString()} at{" "}
                  {formatTime(booking.scheduledTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-sm">
                  {booking.address.street}, {booking.address.city},{" "}
                  {booking.address.state}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Vehicle:</span>{" "}
                {booking.vehicle.year} {booking.vehicle.make}{" "}
                {booking.vehicle.model}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div>
            <h3 className="font-semibold mb-3">Select New Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDates}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <h3 className="font-semibold mb-3">Select New Time</h3>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">
                    Loading available times...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={
                        selectedTime === slot.time ? "default" : "outline"
                      }
                      className={`h-12 ${
                        slot.available
                          ? "hover:bg-green-50 hover:border-green-300"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() =>
                        slot.available && setSelectedTime(slot.time)
                      }
                      disabled={!slot.available}
                    >
                      <div className="text-center">
                        <div className="font-medium">
                          {formatTime(slot.time)}
                        </div>
                        {!slot.available && (
                          <div className="text-xs text-gray-500">
                            {slot.reason}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Appointment Summary */}
          {selectedDate && selectedTime && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm text-green-800">
                  New Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {selectedDate.toLocaleDateString()} at{" "}
                    {formatTime(selectedTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{getServiceNames()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    {booking.address.street}, {booking.address.city},{" "}
                    {booking.address.state}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Total:</span> $
                  {booking.totalAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!selectedDate || !selectedTime || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Reschedule
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
