"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";
import { bookingSlots } from "@/lib/book-appointment";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DateTimePicker = () => {
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    asapChecked,
    setAsapChecked,
  } = useBooking();

  const [error, setError] = React.useState<string>("");

  const router = useRouter();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Today's date (at midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Max date (today + 90 days, at midnight)
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 90);
  maxDate.setHours(0, 0, 0, 0);

  // Generate correctly aligned days for calendar
  const getDaysForMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // Sunday = 0

    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    const daysArray = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startDay + 1;
      daysArray.push(dayNum > 0 && dayNum <= daysInMonth ? dayNum : null);
    }

    return daysArray;
  };

  const days = getDaysForMonth(year, month);

  const changeMonth = (offset: number) => {
    const newDate = new Date(year, month + offset);
    setCurrentDate(newDate);
  };

  // Next step validation
  const handleNext = () => {
    if (!selectedDate) {
      setError("Please select a date to continue.");
      return;
    }
    if (!asapChecked && !selectedSlot) {
      setError("Please select a time slot or choose ASAP.");
      return;
    }
    setError("");
    router.push("/book-appointment?step=location");
  };

  // Prevent selecting past months and months after maxDate
  const isCurrentMonthOrFuture = (year: number, month: number) => {
    // Check if the month is before today
    if (
      year < today.getFullYear() ||
      (year === today.getFullYear() && month < today.getMonth())
    ) {
      return false;
    }
    // Check if the month is after maxDate
    if (
      year > maxDate.getFullYear() ||
      (year === maxDate.getFullYear() && month > maxDate.getMonth())
    ) {
      return false;
    }
    return true;
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <Card className="rounded-2xl p-4">
        <div className="text-center">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(-1)}
              disabled={!isCurrentMonthOrFuture(year, month - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <p className="text-sm font-medium">
              {monthName} {year}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(1)}
              disabled={!isCurrentMonthOrFuture(year, month + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar UI */}
          <div className="grid grid-cols-7 gap-2 text-sm text-gray-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="font-semibold text-center">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (day === null) return <div key={index}></div>;

              const formattedDate = `${year}-${(month + 1)
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

              // Create a date object for this day
              const thisDate = new Date(year, month, day);
              thisDate.setHours(0, 0, 0, 0);
              const isPast = thisDate < today;
              const isAfterMax = thisDate > maxDate;
              const isDisabled = isPast || isAfterMax;

              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && setSelectedDate(formattedDate)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                    isDisabled
                      ? "text-gray-400 cursor-not-allowed bg-gray-100"
                      : selectedDate === formattedDate
                      ? "bg-green-700 text-white"
                      : "text-gray-800 hover:bg-gray-200"
                  }`}
                  disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  aria-disabled={isDisabled}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Time Slots */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Available Time Slots
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {bookingSlots.map((slot) => {
            const label = `${slot.from} - ${slot.to}`;
            const isSelected = selectedSlot === label;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(label)}
                className={`w-full rounded-xl px-4 py-3 text-left border transition-all flex flex-col gap-1
                  ${
                    isSelected
                      ? "bg-green-50 border-green-600 text-green-800"
                      : "bg-[#F5F9FF] border border-transparent text-gray-800"
                  }
                `}
              >
                <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                  <span>From</span>
                  <span>To</span>
                </div>
                <div
                  className={`flex justify-between items-center text-sm font-semibold ${
                    isSelected ? "text-green-800" : "text-gray-900"
                  }`}
                >
                  <span>{slot.from}</span>
                  <span className="mx-1 text-gray-400">&gt;</span>
                  <span>{slot.to}</span>
                </div>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={asapChecked}
            onChange={(e) => setAsapChecked(e.target.checked)}
            className="accent-green-600 w-4 h-4"
          />
          ASAP (First Available Time)
        </label>
        {error && (
          <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
        )}
        <Button
          className="w-full h-12 mt-6 bg-green-700 text-white rounded-full font-semibold"
          onClick={handleNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DateTimePicker;
