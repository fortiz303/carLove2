import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@/hooks/useReactQuery";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface BookingService {
    service: {
        _id: string;
        name: string;
        description: string;
    };
    quantity: number;
    price: number;
}

interface Booking {
    _id: string;
    services: BookingService[];
    totalAmount: number;
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    status:
    | "pending"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
    vehicle: {
        make: string;
        model: string;
        year: number;
        color: string;
        type: string;
    };
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    specialInstructions?: string;
    createdAt: string;
    updatedAt: string;
}

export function useBookingSearch() {
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState("");

    // Use React Query to fetch bookings
    const {
        data: bookings = [],
        isLoading: loading,
        error,
        refetch: fetchBookings,
    } = useQuery(
        ['bookings', session?.accessToken],
        async () => {
            if (!session?.accessToken) {
                throw new Error("No access token available");
            }

            const response = await apiService.getBookings(session.accessToken);
            console.log('API Response:', response); // Debug log

            if (response.success && response.data) {
                // Ensure response.data is an array
                const bookingsData = Array.isArray(response.data) ? response.data : [];
                console.log('Bookings data:', bookingsData); // Debug log
                return bookingsData;
            } else {
                console.log('API response not successful:', response); // Debug log
                throw new Error("Failed to fetch bookings");
            }
        },
        {
            enabled: !!session?.accessToken,
            retry: 2,
            onError: (err) => {
                console.error('Error fetching bookings:', err); // Debug log
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch bookings";
                toast.error(errorMessage);
            },
        }
    );

    // Filter bookings based on search query
    const filteredBookings = useMemo(() => {
        if (!searchQuery.trim()) {
            return bookings;
        }

        const query = searchQuery.toLowerCase();
        return bookings.filter((booking) => {
            const vehicleInfo = `${booking.vehicle.make} ${booking.vehicle.model} ${booking.vehicle.year}`.toLowerCase();
            const addressInfo = `${booking.address.street} ${booking.address.city} ${booking.address.state}`.toLowerCase();
            const serviceNames = booking.services.map((s: BookingService) => s.service.name).join(" ").toLowerCase();
            const status = booking.status.toLowerCase();
            const bookingId = booking._id.toLowerCase();

            return (
                vehicleInfo.includes(query) ||
                addressInfo.includes(query) ||
                serviceNames.includes(query) ||
                status.includes(query) ||
                bookingId.includes(query)
            );
        });
    }, [bookings, searchQuery]);

    // Search statistics
    const searchStats = useMemo(() => {
        return {
            total: bookings.length,
            filtered: filteredBookings.length,
            hasResults: filteredBookings.length > 0,
            hasQuery: searchQuery.trim().length > 0,
        };
    }, [bookings.length, filteredBookings.length, searchQuery]);

    return {
        bookings: filteredBookings,
        searchQuery,
        setSearchQuery,
        loading,
        error: error ? (error instanceof Error ? error.message : "Failed to fetch bookings") : null,
        searchStats,
        refetch: fetchBookings,
    };
} 