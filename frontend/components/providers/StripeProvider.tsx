"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export function StripeProvider({
  children,
  clientSecret,
}: StripeProviderProps) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe" as const,
          variables: {
            colorPrimary: "#15803d", // Green color to match the app theme
          },
        },
      }
    : {};

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
