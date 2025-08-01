"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CarDetails {
  make: string;
  model: string;
  year: number;
  color: string;
  type: "sedan" | "suv" | "truck" | "luxury" | "other";
  licensePlate?: string;
  vin?: string;
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  instructions: string;
}

export interface BookingContextType {
  step: string;
  setStep: (step: string) => void;
  selectedServiceId: number | null;
  setSelectedServiceId: (id: number | null) => void;
  selectedExtras: string[];
  setSelectedExtras: (extras: string[]) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
  asapChecked: boolean;
  setAsapChecked: (checked: boolean) => void;
  location: string;
  setLocation: (location: string) => void;
  addressData: AddressData | null;
  setAddressData: (address: AddressData | null) => void;
  selectedFrequency: string;
  setSelectedFrequency: (freq: string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  pricing: { subtotal: number; discount: number; total: number } | null;
  setPricing: (
    pricing: { subtotal: number; discount: number; total: number } | null
  ) => void;
  carDetails: CarDetails | null;
  setCarDetails: (details: CarDetails | null) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState("service");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [asapChecked, setAsapChecked] = useState(false);
  const [location, setLocation] = useState("");
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState("weekly");
  const [promoCode, setPromoCode] = useState("");
  const [pricing, setPricing] = useState<{
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);
  const [carDetails, setCarDetails] = useState<CarDetails | null>(null);

  return (
    <BookingContext.Provider
      value={{
        step,
        setStep,
        selectedServiceId,
        setSelectedServiceId,
        selectedExtras,
        setSelectedExtras,
        currentDate,
        setCurrentDate,
        selectedDate,
        setSelectedDate,
        selectedSlot,
        setSelectedSlot,
        asapChecked,
        setAsapChecked,
        location,
        setLocation,
        addressData,
        setAddressData,
        selectedFrequency,
        setSelectedFrequency,
        promoCode,
        setPromoCode,
        pricing,
        setPricing,
        carDetails,
        setCarDetails,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
