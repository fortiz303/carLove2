"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, Edit, Trash2, Star, Check } from "lucide-react";
import CarDetailsDialog from "./CarDetailsDialog";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/hooks/useAuth";
import { apiService as api } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: "sedan" | "suv" | "truck" | "luxury" | "other";
  licensePlate?: string;
  vin?: string;
  nickname?: string;
  isDefault: boolean;
  createdAt: string;
}

interface VehicleSelectorProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle?: Vehicle | null;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  onVehicleSelect,
  selectedVehicle,
}) => {
  const { user, accessToken } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string>("");

  // Fetch user's vehicles
  const fetchVehicles = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await api.getVehicles(accessToken);
      if (response.success) {
        setVehicles(response.data.vehicles);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setError("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchVehicles();
    }
  }, [user, accessToken]);

  const handleAddVehicle = async (vehicleData: any) => {
    if (!accessToken) return;

    try {
      const response = await api.addVehicle(vehicleData, accessToken);
      if (response.success) {
        setVehicles(response.data.vehicles);
        setShowAddDialog(false);
        setError("");
      }
    } catch (error) {
      console.error("Error adding vehicle:", error);
      setError("Failed to add vehicle");
    }
  };

  const handleUpdateVehicle = async (vehicleData: any) => {
    if (!editingVehicle || !accessToken) return;

    try {
      const response = await api.updateVehicle(
        editingVehicle._id,
        vehicleData,
        accessToken
      );
      if (response.success) {
        setVehicles(response.data.vehicles);
        setEditingVehicle(null);
        setError("");
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
      setError("Failed to update vehicle");
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!accessToken) return;

    try {
      const response = await api.deleteVehicle(vehicleId, accessToken);
      if (response.success) {
        setVehicles(response.data.vehicles);
        // If the deleted vehicle was selected, clear selection
        if (selectedVehicle?._id === vehicleId) {
          onVehicleSelect(null as any);
        }
        setError("");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setError("Failed to delete vehicle");
    }
  };

  const handleSetDefault = async (vehicleId: string) => {
    if (!accessToken) return;

    try {
      const response = await api.setDefaultVehicle(vehicleId, accessToken);
      if (response.success) {
        setVehicles(response.data.vehicles);
        setError("");
      }
    } catch (error) {
      console.error("Error setting default vehicle:", error);
      setError("Failed to set default vehicle");
    }
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    if (vehicle.nickname) {
      return vehicle.nickname;
    }
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const getVehicleTypeColor = (type: string) => {
    const colors = {
      sedan: "bg-blue-100 text-blue-800",
      suv: "bg-green-100 text-green-800",
      truck: "bg-orange-100 text-orange-800",
      luxury: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Select Your Vehicle</h3>
          {/* {vehicles.length > 0 && (
             <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   if (selectedVehicle) {
                     onVehicleSelect(null as any);
                   } else if (vehicles.length > 0) {
                     onVehicleSelect(vehicles[0]);
                   }
                 }}
               >
                 {selectedVehicle ? "Clear Selection" : "Select First Vehicle"}
               </Button>
             </div>
           )} */}
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {vehicles.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-8">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No vehicles saved yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle._id}
              className={`transition-all hover:shadow-md ${
                selectedVehicle?._id === vehicle._id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={selectedVehicle?._id === vehicle._id}
                        onCheckedChange={() => onVehicleSelect(vehicle)}
                        className="mr-2"
                      />
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <Car className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {getVehicleDisplayName(vehicle)}
                          </h4>
                          {vehicle.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge className={getVehicleTypeColor(vehicle.type)}>
                            {vehicle.type.toUpperCase()}
                          </Badge>
                          <span>{vehicle.color}</span>
                          {vehicle.licensePlate && (
                            <span>• {vehicle.licensePlate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVehicle(vehicle);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle._id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <CarDetailsDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddVehicle}
        title="Add New Vehicle"
      />

      {/* Edit Vehicle Dialog */}
      <CarDetailsDialog
        open={!!editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
        onSave={handleUpdateVehicle}
        initialData={editingVehicle || undefined}
        title="Edit Vehicle"
      />
    </div>
  );
};

export default VehicleSelector;
