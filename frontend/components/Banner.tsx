"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface BannerImage {
  src: string;
  alt: string;
}

const bannerImages: BannerImage[] = [
  // {
  //   src: "/images/car1.png",
  //   alt: "Car Detailing Service 1",
  // },
  {
    src: "/images/car.png",
    alt: "Car Detailing Service 2",
  },
  {
    src: "/images/imgcar.png",
    alt: "Car Detailing Service 3",
  },
];

export default function Banner() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % bannerImages.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 mt-6">
      <Card className="overflow-hidden rounded-[1.5rem] shadow-xl">
        <CardContent className="p-0">
          <div className="bg-green-900 relative rounded-[1.5rem] h-48 sm:h-64">
            {/* Image Container */}
            <div className="relative w-full h-full">
              {bannerImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  {/* Overlay for better visibility */}
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-2">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-white scale-110"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === 0 ? bannerImages.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Previous image"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={() =>
                setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length)
              }
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Next image"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
