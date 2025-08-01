"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  _id: string;
  services: Array<{
    service: {
      _id: string;
      name: string;
      description: string;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: string;
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
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  accessToken: string;
  onRated: () => void;
}

export default function RatingDialog({
  isOpen,
  onClose,
  booking,
  accessToken,
  onRated,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const { apiService } = await import("@/lib/api");
      const response = await apiService.addReview(
        booking._id,
        rating,
        review.trim() || "",
        accessToken
      );

      if (response.success) {
        toast.success("Thank you for your review!");
        onRated();
        onClose();
        // Reset form
        setRating(0);
        setReview("");
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Rate Your Experience
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Stars */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">
              How would you rate your experience?
            </p>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Review Text */}
          <div>
            <label
              htmlFor="review"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Comments (Optional)
            </label>
            <Textarea
              id="review"
              placeholder="Tell us about your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
