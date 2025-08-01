"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookingSearchModal from "./BookingSearchModal";

interface BookingSearchInputProps {
  placeholder?: string;
  className?: string;
}

export default function BookingSearchInput({
  placeholder = "Search bookings...",
  className = "",
}: BookingSearchInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFocus = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
        <Input
          placeholder={placeholder}
          className="pr-10 h-10 bg-white rounded-full border-0 text-sm cursor-pointer py-6"
          onFocus={handleFocus}
          readOnly
        />
      </div>

      <BookingSearchModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
