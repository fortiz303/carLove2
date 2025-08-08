"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface CarDetails {
  make: string;
  model: string;
  year: number;
  color: string;
  type: "sedan" | "suv" | "truck" | "luxury" | "other";
  licensePlate?: string;
  vin?: string;
  nickname?: string;
}

interface CarDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (carDetails: CarDetails) => void;
  initialData?: CarDetails;
  title?: string;
  showSelection?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

const CarDetailsDialog: React.FC<CarDetailsDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  title = "Vehicle Details",
  showSelection = false,
  isSelected = false,
  onSelectionChange,
}) => {
  const [carDetails, setCarDetails] = useState<CarDetails>(
    initialData || {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      type: "sedan",
      licensePlate: "",
      vin: "",
      nickname: "",
    }
  );

  const [errors, setErrors] = useState<Partial<CarDetails>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!carDetails.make.trim()) {
      newErrors.make = "Make is required";
    }
    if (!carDetails.model.trim()) {
      newErrors.model = "Model is required";
    }
    if (
      !carDetails.year ||
      carDetails.year < 1900 ||
      carDetails.year > new Date().getFullYear() + 1
    ) {
      newErrors.year = "Valid year is required";
    }
    if (!carDetails.color.trim()) {
      newErrors.color = "Color is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(carDetails);
      onOpenChange(false);
    }
  };

  const handleInputChange = (
    field: keyof CarDetails,
    value: string | number
  ) => {
    setCarDetails((prev) => {
      const updated = { ...prev };
      if (field === "year") {
        updated[field] = value as number;
      } else if (field === "type") {
        updated[field] = value as
          | "sedan"
          | "suv"
          | "truck"
          | "luxury"
          | "other";
      } else {
        updated[field] = value as string;
      }
      return updated;
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              value={carDetails.nickname || ""}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              placeholder="e.g., My Daily Driver"
            />
            <p className="text-sm text-gray-500">
              Give your vehicle a nickname for easy identification
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={carDetails.make}
                onChange={(e) => handleInputChange("make", e.target.value)}
                placeholder="e.g., Toyota"
                className={errors.make ? "border-red-500" : ""}
              />
              {errors.make && (
                <p className="text-red-500 text-sm">{errors.make}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={carDetails.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g., Camry"
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && (
                <p className="text-red-500 text-sm">{errors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={carDetails.year}
                onChange={(e) =>
                  handleInputChange(
                    "year",
                    parseInt(e.target.value) || new Date().getFullYear()
                  )
                }
                placeholder="2024"
                min="1900"
                max={new Date().getFullYear() + 1}
                className={errors.year ? "border-red-500" : ""}
              />
              {errors.year && (
                <p className="text-red-500 text-sm">{errors.year}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={carDetails.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="e.g., White"
                className={errors.color ? "border-red-500" : ""}
              />
              {errors.color && (
                <p className="text-red-500 text-sm">{errors.color}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Vehicle Type *</Label>
            <Select
              value={carDetails.type}
              onValueChange={(value) =>
                handleInputChange("type", value as CarDetails["type"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate (Optional)</Label>
              <Input
                id="licensePlate"
                value={carDetails.licensePlate || ""}
                onChange={(e) =>
                  handleInputChange("licensePlate", e.target.value)
                }
                placeholder="ABC123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN (Optional)</Label>
              <Input
                id="vin"
                value={carDetails.vin || ""}
                onChange={(e) => handleInputChange("vin", e.target.value)}
                placeholder="1HGBH41JXMN109186"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          {showSelection && onSelectionChange && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-vehicle"
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onSelectionChange(checked as boolean)
                }
              />
              <Label htmlFor="select-vehicle" className="text-sm font-medium">
                Select this vehicle for detailing
              </Label>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Vehicle</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
