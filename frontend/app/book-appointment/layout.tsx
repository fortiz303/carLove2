"use client";

import { useSearchParams } from "next/navigation";
import { headerContent } from "@/lib/book-appointment";
import { Suspense } from "react";

interface BookAppointmentLayoutProps {
  children: React.ReactNode;
  searchParams: { step: string };
}

function BookAppointmentHeader() {
  const t = useSearchParams();
  const step = t.get("step") || "service";

  const { title, description } =
    headerContent[step as keyof typeof headerContent];

  return (
    <div className="bg-[#0E5814] text-white py-6 px-4">
      <h1 className="text-2xl font-bold">{title ?? "N/A"}</h1>
      <p className="text-sm mt-1">{description ?? "N/A"}</p>
    </div>
  );
}

export default function BookAppointmentLayout({
  children,
  searchParams,
}: BookAppointmentLayoutProps) {
  return (
    <div className="">
      {/* header  */}
      <Suspense
        fallback={
          <div className="bg-[#0E5814] text-white py-6 px-4">
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-sm mt-1">Loading...</p>
          </div>
        }
      >
        <BookAppointmentHeader />
      </Suspense>
      {/* body  */}
      <div>{children}</div>
    </div>
  );
}
