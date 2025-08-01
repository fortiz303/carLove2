"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

interface StripeCardInputProps {
  onCardComplete?: (complete: boolean) => void;
  disabled?: boolean;
}

export function StripeCardInput({
  onCardComplete,
  disabled = false,
}: StripeCardInputProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleCardChange = (event: any) => {
    setError(null);

    if (event.error) {
      setError(event.error.message);
    }

    if (onCardComplete) {
      onCardComplete(event.complete);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <div className="space-y-2">
      <div
        className={`border rounded-lg p-3 bg-white ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <CardElement options={cardElementOptions} onChange={handleCardChange} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
