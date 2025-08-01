"use client";

import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import PrimaryLayout from "@/components/layout/primary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardServicesList from "@/components/DashboardServicesList";
import Banner from "@/components/Banner";
import BookingSearchInput from "@/components/BookingSearchInput";
import SettingsPopover from "@/components/SettingsPopover";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <PrimaryLayout>
      {/* Header */}
 <div className="bg-green-900 px-4 py-8 shadow-md">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      {/* Avatar with Glowing Ring */}
      <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#66ffcc] to-[#006633]">
        <div className="w-full h-full rounded-full bg-green-900 flex items-center justify-center">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-teal-500 to-teal-700 text-white">
              {getInitials(user?.name || "User")}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <h1 className="text-white text-2xl font-semibold">Good Morning!</h1>
        <p className="text-white text-sm opacity-90">Ready For Car Detailing?</p>
      </div>
    </div>
    <SettingsPopover />
  </div>

  {/* Search Bar */}
  {/* <BookingSearchInput placeholder="Search bookings..." /> */}
</div>


      {/* Banner */}
      {/* <Banner /> */}

      {/* Services */}
      <DashboardServicesList />
    </PrimaryLayout>
  );
}
