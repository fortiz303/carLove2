"use client";

import Image from "next/image";
import { useBooking } from "@/contexts/BookingContext";
import React from "react"; // Added missing import
import { useRouter } from "next/navigation";
import CarDetailsDialog from "./CarDetailsDialog";
import { Button } from "@/components/ui/button";

export interface ServiceOption {
  id: number;
  image: string;
  title: string;
  description: string;
}

interface ServiceListProps {
  options: ServiceOption[];
  extras: string[];
}

const ServiceList = ({ options, extras }: ServiceListProps) => {
  const {
    selectedServiceId,
    setSelectedServiceId,
    selectedExtras,
    setSelectedExtras,
    carDetails,
    setCarDetails,
  } = useBooking();
  const router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [showCarDialog, setShowCarDialog] = React.useState(false);

  const handleNext = () => {
    if (!selectedServiceId) {
      setError("Please select a service to continue.");
      return;
    }
    if (!carDetails) {
      setError("Please add your vehicle details to continue.");
      return;
    }
    setError("");
    router.push("/book-appointment?step=date-time");
  };

  const handleCarDetailsSave = (details: any) => {
    setCarDetails(details);
    setError("");
  };

  return (
    <>
      {/* Detailing Options */}
      <div className="max-w-md mx-auto mt-4 px-4">
        <div className=" bg-white">
          <div className="flex justify-between gap-2 overflow-x-auto">
            {options.map((option) => (
              <div
                key={option.id}
                className={`relative flex-1 min-w-[100px] rounded-xl p-3 border transition-all duration-200 cursor-pointer ${
                  selectedServiceId === option.id
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
                onClick={() => setSelectedServiceId(option.id)}
              >
                <div className="w-10 h-10 mx-auto mb-2 relative">
                  <Image
                    src={option.image}
                    alt={option.title}
                    width={40}
                    height={40}
                    className="mx-auto"
                  />
                  {selectedServiceId === option.id && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 text-green-600 bg-white rounded-full flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {option.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-tight">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extras */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Customize Your Service
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Select Any Extras You’d Like To Include:
        </p>
        <div className="flex flex-wrap gap-2">
          {extras.map((extra, i) => {
            const selected = selectedExtras.includes(extra);
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${
                  selected
                    ? "bg-green-100 text-green-800 border-green-600"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
                onClick={() =>
                  (
                    setSelectedExtras as React.Dispatch<
                      React.SetStateAction<string[]>
                    >
                  )((prev) =>
                    prev.includes(extra)
                      ? prev.filter((e) => e !== extra)
                      : [...prev, extra]
                  )
                }
              >
                <img
                  src="/images/Vector.png"
                  alt="check icon"
                  className="w-4 h-4"
                />
                {extra}
              </div>
            );
          })}
        </div>
      </div>
      {/* Car Details Section */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Vehicle Information
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Please provide your vehicle details:
        </p>

        {carDetails ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-green-800">
                  {carDetails.year} {carDetails.make} {carDetails.model}
                </p>
                <p className="text-sm text-green-600">
                  Color: {carDetails.color} | Type: {carDetails.type}
                </p>
                {carDetails.licensePlate && (
                  <p className="text-sm text-green-600">
                    License: {carDetails.licensePlate}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCarDialog(true)}
                className="text-green-600 border-green-300 hover:bg-green-100"
              >
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-600 mb-3">No vehicle details added yet.</p>
            <Button onClick={() => setShowCarDialog(true)} className="w-full">
              Add Vehicle Details
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 flex flex-col items-center">
        <button
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
          onClick={handleNext}
        >
          Next
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <CarDetailsDialog
        open={showCarDialog}
        onOpenChange={setShowCarDialog}
        onSave={handleCarDetailsSave}
        initialData={carDetails || undefined}
      />
    </>
  );
};

export default ServiceList;
