import "./globals.css";
import type React from "react";
import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "CARLOVE - Professional Car Detailing at Your Doorstep",
  description:
    "Get your car detailed by experts without leaving your home. Professional car detailing services delivered right to your doorstep.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/repalash/gilroy-free-webfont@fonts/Gilroy-Extrabold.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/repalash/gilroy-free-webfont@fonts/Gilroy-Light.css"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Gilroy" }}>
        <QueryProvider>
          <SessionProvider>{children}</SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
