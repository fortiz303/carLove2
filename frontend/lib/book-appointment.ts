// This file now provides utility functions for booking appointment
// The actual service data is fetched from the backend

const bookingSlots = [
    {
        id: 1,
        from: "08:00 AM",
        to: "12:00 PM",
    },
    {
        id: 2,
        from: "04:00 PM",
        to: "08:00 PM",
    },
];

const extras = [
    "Wax & Polish",
    "Engine Bay Cleaning",
    "Pet Hair Removal",
    "Odor Elimination",
    "Headlight Restoration",
];

const headerContent = {
    service: {
        title: "Select Your Service",
        description: "Pick A Detailing Type And Add Any Extras.",
    },
    "date-time": {
        title: "Select Your Date And Time",
        description: "Book now or pick a time that suits your schedule.",
    },
    location: {
        title: "Service Location",
        description: "Tell us where to come.",
    },
    payment: {
        title: "Enter Your Payment Method",
        description: "Secure & hassle-free payment.",
    },
};

// Function to transform backend services to frontend format
export const transformServicesToOptions = (services: any[]) => {
    return services.map((service, index) => ({
        id: index + 1, // Map to frontend IDs 1, 2, 3
        image: service.image || `/images/image${index + 1}.png`,
        title: service.name,
        description: service.description,
        backendId: service._id, // Store the backend ObjectId
    }));
};

export { bookingSlots, extras, headerContent };