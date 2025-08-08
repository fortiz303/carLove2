"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ServiceList from "@/components/ServiceList";
import LocationStep from "@/components/LocationStep";
import DateTimePicker from "@/components/DateTimePicker";
import PaymentSection from "@/components/PaymentSection";
import { useBooking, BookingProvider } from "@/contexts/BookingContext";
import { extras, transformServicesToOptions } from "@/lib/book-appointment";
import PrimaryLayout from "@/components/layout/primary";
import { useServices } from "@/hooks/useServices";

function ServiceStep({ step }: { step: string }) {
  const { services, loading } = useServices();

  if (step !== "service") return null;

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-4 px-4">
        <div className="text-center">
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  const serviceOptions = transformServicesToOptions(services);
  return <ServiceList options={serviceOptions} extras={extras} />;
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
  const { services, loading } = useServices();

  if (step !== "payment") return null;

  const serviceOptions = transformServicesToOptions(services);
  const selectedService = serviceOptions.find(
    (o) => o.id === selectedServiceId
  );

  return (
    <PaymentSection
      serviceInfo={{
        title: selectedService?.title || "Service",
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

function BookAppointmentWithSearchParams() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "service";
  return (
    <BookingProvider>
      <BookAppointmentContent step={step} />
    </BookingProvider>
  );
}

export default function BookAppointmentPage() {
  return (
    <PrimaryLayout>
      <Suspense
        fallback={
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        }
      >
        <BookAppointmentWithSearchParams />
      </Suspense>
    </PrimaryLayout>
  );
}
