    "use client";

    import { Button } from "@/components/ui/button";
    import {
    Calendar,
    Clock,
    MapPin,
    Settings,
    Home,
    Plus,
    MessageCircle,
    User,
    } from "lucide-react";
    import Image from "next/image";
    import Link from "next/link";

    export default function ConfirmPage() {
    return (
        <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="bg-green-900 px-4 py-8 text-white">
            <h1 className="text-2xl font-bold mb-1">Booking Confirmed</h1>
            <p className="text-sm text-white/90">Secure & Hassle-Free Payment.</p>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 max-w-md mx-auto text-center">
            {/* Illustration */}
            <Image
            src="/images/confirm.png"
            alt="Booking confirmed"
            width={300}
            height={200}
            className="mx-auto mb-6"
            />

            <h2 className="text-xl font-bold mb-2">Your booking is confirmed!</h2>

            {/* Booking Info Box */}
            <div className="mt-4 bg-gray-50 border rounded-xl p-4 text-left text-sm space-y-3">
            {/* Service */}
            <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
                <span>
                <strong>Service:</strong> Interior & Exterior Detailing
                </span>
            </div>

            {/* Date & Time */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-4 h-4 text-green-700" />
                <span>
                    <strong>Date:</strong> Saturday, July 6, 2025
                </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-green-700" />
                <span>
                    <strong>Time:</strong> 11:00 AM
                </span>
                </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-[2px] text-green-700 shrink-0" />
                <span>
                <strong>Location:</strong> 123 Street Name, City, ZIP
                </span>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-3 mt-6">
            <Button
                variant="outline"
                className="rounded-full border-black text-black font-medium w-1/2"
            >
                Track Booking
            </Button>
            <Link href="/dashboard" className="w-1/2">
                <Button className="w-full rounded-full bg-green-700 text-white font-semibold">
                Go To Dashboard
                </Button>
            </Link>
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-white border-t md:hidden">
            <div className="max-w-md mx-auto rounded-full bg-white shadow border flex justify-around py-2">
            <Link href="/dashboard" className="flex flex-col items-center">
                <Home className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Home</span>
            </Link>
            <Link href="/bookings" className="flex flex-col items-center">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-[10px] text-green-600 font-semibold">
                Booking
                </span>
            </Link>
            <Link
                href="/booking"
                className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full -mt-4"
            >
                <Plus className="w-4 h-4 text-gray-700" />
            </Link>
            <Link href="/support" className="flex flex-col items-center">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Chat</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Profile</span>
            </Link>
            </div>
        </div>
        </div>
    );
    }
