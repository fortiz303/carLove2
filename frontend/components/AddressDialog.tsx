"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Address } from "@/lib/api";
import { toast } from "sonner";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
  onSave: (address: Omit<Address, "_id">) => Promise<void>;
  mode: "add" | "edit";
}

export function AddressDialog({
  open,
  onOpenChange,
  address,
  onSave,
  mode,
}: AddressDialogProps) {
  const [formData, setFormData] = useState({
    type: "home" as "home" | "work" | "other",
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address && mode === "edit") {
      setFormData({
        type: address.type,
        label: address.label,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      setFormData({
        type: "home",
        label: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        isDefault: false,
      });
    }
    setErrors({});
  }, [address, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSave(formData);
      toast.success(
        mode === "add"
          ? "Address added successfully!"
          : "Address updated successfully!"
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Address save error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save address. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Address" : "Edit Address"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Address Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "home" | "work" | "other") =>
                setFormData({ ...formData, type: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="e.g., Home, Work, Grandma's House"
              className={errors.label ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.label && (
              <p className="text-red-500 text-sm">{errors.label}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              placeholder="123 Main St"
              className={errors.street ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.street && (
              <p className="text-red-500 text-sm">{errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="City"
                className={errors.city ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="State"
                className={errors.state ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.state && (
                <p className="text-red-500 text-sm">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              placeholder="12345"
              className={errors.zipCode ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.zipCode && (
              <p className="text-red-500 text-sm">{errors.zipCode}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : mode === "add"
                ? "Add Address"
                : "Update Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
