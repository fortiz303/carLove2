"use client";

import React from "react";
import ServiceList from "@/components/ServiceList";
import LocationStep from "@/components/LocationStep";
import DateTimePicker from "@/components/DateTimePicker";
import PaymentSection from "@/components/PaymentSection";
import { useBooking, BookingProvider } from "@/contexts/BookingContext";
import { detailingOptions, extras } from "@/lib/book-appointment";
import PrimaryLayout from "@/components/layout/primary";

interface BookAppointmentPageProps {
  searchParams: {
    step: string;
  };
}

function ServiceStep({ step }: { step: string }) {
  if (step !== "service") return null;
  return <ServiceList options={detailingOptions} extras={extras} />;
}

function DateTimeStep({ step }: { step: string }) {
  if (step !== "date-time") return null;
  return <DateTimePicker />;
}

function LocationStepWrapper({ step }: { step: string }) {
  if (step !== "location") return null;
  return <LocationStep />;
}

function PaymentStep({ step }: { step: string }) {
  const { selectedServiceId, selectedDate, location, carDetails, setStep } =
    useBooking();
  if (step !== "payment") return null;
  return (
    <PaymentSection
      serviceInfo={{
        title:
          detailingOptions.find((o) => o.id === selectedServiceId)?.title ||
          "Service",
        date: selectedDate || "Date",
        location: location || "Address not set",
        vehicle: carDetails
          ? `${carDetails.year} ${carDetails.make} ${carDetails.model}`
          : undefined,
      }}
    />
  );
}

function BookAppointmentContent({ step }: { step: string }) {
  return (
    <div>
      <h1 className="text-center text-2xl font-bold">Book Appointment</h1>
      <ServiceStep step={step} />
      <DateTimeStep step={step} />
      <LocationStepWrapper step={step} />
      <PaymentStep step={step} />
    </div>
  );
}

export default function BookAppointmentPage({
  searchParams,
}: BookAppointmentPageProps) {
  const step = searchParams.step || "service";
  return (
    <PrimaryLayout>
      <BookingProvider>
        <BookAppointmentContent step={step} />
      </BookingProvider>
    </PrimaryLayout>
  );
}
