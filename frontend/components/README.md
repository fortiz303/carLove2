# Booking Search Components

This directory contains components for searching and displaying bookings in a modal interface.

## Components

### BookingSearchInput

A search input component that opens a modal when focused.

**Props:**

- `placeholder?: string` - Custom placeholder text (default: "Search bookings...")
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
import BookingSearchInput from "@/components/BookingSearchInput";

<BookingSearchInput placeholder="Search your bookings..." className="w-full" />;
```

### BookingSearchModal

A modal component that displays searchable booking results.

**Props:**

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal should close

**Features:**

- Real-time search filtering
- Booking status indicators with colors and icons
- Vehicle information display
- Service details
- Date and time formatting
- Address information
- Total amount display
- Keyboard shortcuts (Escape to close)
- Loading states
- Empty state handling

**Usage:**

```tsx
import BookingSearchModal from "@/components/BookingSearchModal";

const [isModalOpen, setIsModalOpen] = useState(false);

<BookingSearchModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>;
```

## Hooks

### useBookingSearch

A custom hook that provides booking search functionality.

**Returns:**

- `bookings: Booking[]` - Filtered booking results
- `searchQuery: string` - Current search query
- `setSearchQuery: (query: string) => void` - Update search query
- `loading: boolean` - Loading state
- `error: string | null` - Error message if any
- `searchStats: { total: number, filtered: number, hasResults: boolean, hasQuery: boolean }` - Search statistics
- `refetch: () => void` - Refetch bookings

**Usage:**

```tsx
import { useBookingSearch } from "@/hooks/useBookingSearch";

const { bookings, searchQuery, setSearchQuery, loading, searchStats } =
  useBookingSearch();
```

## Search Functionality

The search works across multiple fields:

- Vehicle make, model, and year
- Service names
- Address information (street, city, state)
- Booking status
- Booking ID

## Styling

Components use Tailwind CSS classes and follow the existing design system:

- Status badges with appropriate colors
- Icons from Lucide React
- Responsive design
- Hover effects and transitions

## Integration

These components are designed to work with:

- NextAuth.js for authentication
- The existing API service for data fetching
- The booking data structure from the backend
- The existing UI component library
