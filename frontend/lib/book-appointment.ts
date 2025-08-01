const detailingOptions = [
    {
        id: 1,
        image: "/images/image1.png",
        title: "Interior Only",
        description: "Deep Clean Seats, Carpets, Panels, And More.",
    },
    {
        id: 2,
        image: "/images/image2.png",
        title: "Exterior Only",
        description: "Wash, Polish, And Protect Your Car’s Exterior.",
    },
    {
        id: 3,
        image: "/images/image3.png",
        title: "Full Detail",
        description: "Complete Interior And Exterior Service.",
    },
];

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

export { detailingOptions, extras, headerContent, bookingSlots };