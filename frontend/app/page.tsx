"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const controls = useAnimation();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const swipeRef = useRef(null);

  // Swipe threshold in px
  const SWIPE_THRESHOLD = 180;

  const handleDragEnd = async (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      await controls.start({
        x: 260,
        opacity: 0,
        transition: { duration: 0.3 },
      });
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } else {
      controls.start({ x: 0, opacity: 1, transition: { duration: 0.2 } });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E5814] flex flex-col justify-between relative overflow-hidden">
      {/* Background Circles */}
      <div className="absolute inset-0 flex items-center justify-center z-0 -mt-96">
        <div className="w-[500px] h-[500px] bg-green-600 rounded-full opacity-10"></div>
        <div className="absolute w-[400px] h-[400px] bg-green-600 rounded-full opacity-10"></div>
        <div className="absolute w-[300px] h-[300px] bg-green-600 rounded-full opacity-10"></div>
        <div className="absolute w-[200px] h-[200px] bg-green-600 rounded-full opacity-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-end px-4 sm:px-8 pt-6 sm:pt-12 z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-36 sm:mb-24">
          <div className="relative w-40 h-36 sm:w-44 sm:h-44 mb-1">
            <Image
              src="/images/home-logo.png"
              alt="CARLOVE Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Card Section */}
        <div className="w-full max-w-lg sm:max-w-2xl md:max-w-3xl z-10 mb-10">
          <Card className="rounded-3xl shadow-2xl">
            <CardContent className="p-6 sm:p-10 lg:p-12  flex flex-col h-full justify-between">
              <div className="mb-4 sm:mb-6">
                <h2 className="font-extrabold uppercase text-[39.08px] leading-[47.8px] text-black mb-2 sm:mb-2">
                  YOUR CAR, OUR
                  <span className="font-extrabold uppercase text-[44.08px] leading-[52.8px] text-black mb-3 sm:mb-5">
                    {" "}
                    CARE – AT YOUR{" "}
                  </span>
                  <span className="text-[49.08px] bg-gradient-to-b from-black to-[#0A9367] bg-clip-text text-transparent">
                    DOORSTEP
                  </span>
                </h2>

                <p className="font-normal text-[14px] leading-[23px] text-black/70 max-w-xl mx-auto">
                  Get your car detailed by experts without leaving your home. We
                  bring top-tier tools, products...
                </p>
              </div>

              {/* CTA */}
              <div className="space-y-4 mt-auto">
                {/* Track */}
                <div className="relative w-full h-14 sm:h-16 rounded-full border-[1.5px] border-gray-300 bg-white flex items-center justify-center overflow-hidden select-none shadow-sm">
                  {/* Swipe Button */}
                  <motion.div
                    ref={swipeRef}
                    className="absolute left-2 w-12 h-12 sm:w-14 sm:h-14 bg-[#0A9367] rounded-full flex items-center justify-center text-white cursor-grab z-10 border border-black"
                    drag="x"
                    dragConstraints={{ left: 0, right: 260 }}
                    dragElastic={0.8}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    initial={{ x: 0, opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ touchAction: "pan-x" }}
                  >
                    <span className="text-white text-3xl sm:text-4xl -mt-[2px]">
                      »
                    </span>
                  </motion.div>

                  {/* Swipe Text */}
                  <span className="text-gray-900 font-semibold text-base sm:text-xl pointer-events-none">
                    Swipe To Start...
                  </span>
                </div>

                {/* Skip Button */}
                <div className="flex justify-center">
                  <button
                    className="text-sm sm:text-base text-gray-500 underline"
                    onClick={() =>
                      router.push(isAuthenticated ? "/dashboard" : "/login")
                    }
                  >
                    Skip
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
