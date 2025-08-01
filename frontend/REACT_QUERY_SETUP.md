# React Query Setup

This project has been configured with React Query (TanStack Query) for efficient data fetching, caching, and state management.

## Setup Overview

### 1. QueryProvider

The `QueryProvider` is configured in `components/providers/QueryProvider.tsx` and wraps the entire application in `app/layout.tsx`.

### 2. Default Configuration

- **Stale Time**: 1 minute (data is considered fresh for 1 minute)
- **Cache Time**: 10 minutes (data stays in cache for 10 minutes)
- **Retry**: 1 attempt for failed requests
- **Refetch on Window Focus**: Disabled

## Usage Examples

### Basic Query Hook

```typescript
import { useServices } from "@/hooks/useServices";

function ServicesList() {
  const { data: services, isLoading, error } = useServices();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {services?.map((service) => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  );
}
```

### Individual Service Query

```typescript
import { useService } from "@/hooks/useServices";

function ServiceDetail({ serviceId }: { serviceId: string }) {
  const { data: service, isLoading } = useService(serviceId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{service?.name}</h1>
      <p>{service?.description}</p>
      <p>Price: ${service?.price}</p>
    </div>
  );
}
```

### Creating Custom Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@/hooks/useReactQuery";
import { apiService } from "@/lib/api";

// Query keys for better cache management
const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters: string) => [...bookingKeys.lists(), { filters }] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

// Custom hook for fetching bookings
export const useBookings = (accessToken: string) => {
  return useQuery({
    queryKey: bookingKeys.lists(),
    queryFn: async () => {
      const response = await apiService.getBookings(accessToken);
      return response.data;
    },
    enabled: !!accessToken,
  });
};

// Custom hook for creating a booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingData,
      accessToken,
    }: {
      bookingData: any;
      accessToken: string;
    }) => {
      const response = await apiService.createBooking(bookingData, accessToken);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries(bookingKeys.lists());
    },
  });
};
```

## Best Practices

### 1. Query Keys

- Use structured query keys for better cache management
- Include dependencies in query keys
- Use consistent naming conventions

### 2. Error Handling

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    // Custom retry logic
    if (error.status === 404) return false;
    return failureCount < 3;
  },
});
```

### 3. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(["data"]);

    // Snapshot previous value
    const previousData = queryClient.getQueryData(["data"]);

    // Optimistically update
    queryClient.setQueryData(["data"], newData);

    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["data"], context?.previousData);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries(["data"]);
  },
});
```

### 4. Infinite Queries

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["infinite-data"],
    queryFn: ({ pageParam = 0 }) => fetchData(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  });
```

## Available Hooks

### Core Hooks

- `useQuery` - For fetching data
- `useMutation` - For modifying data
- `useQueryClient` - Access to query client instance
- `useInfiniteQuery` - For paginated data

### Utility Hooks

- `useInvalidateQueries` - Custom hook for cache invalidation

## Cache Management

### Manual Cache Updates

```typescript
const queryClient = useQueryClient();

// Update cache directly
queryClient.setQueryData(["data"], newData);

// Invalidate queries
queryClient.invalidateQueries(["data"]);

// Remove queries from cache
queryClient.removeQueries(["data"]);
```

### Background Refetching

```typescript
const { data, isStale } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  refetchOnMount: true,
});
```

## DevTools (Optional)

To enable React Query DevTools in development:

```typescript
import { ReactQueryDevtools } from "react-query/devtools";

// Add to your QueryProvider
<QueryClientProvider client={queryClient}>
  {children}
  {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
</QueryClientProvider>;
```

## Migration from Existing Code

When migrating existing API calls to React Query:

1. Replace direct API calls with `useQuery` or `useMutation`
2. Add proper loading and error states
3. Implement cache invalidation where needed
4. Use query keys for better cache management
5. Consider optimistic updates for better UX

## Troubleshooting

### Common Issues

1. **Stale Data**: Check `staleTime` and `cacheTime` settings
2. **Infinite Refetching**: Ensure query keys are stable
3. **Memory Leaks**: Use `enabled` option to conditionally run queries
4. **Race Conditions**: Use `enabled` and proper query key dependencies

### Debug Tips

- Use React Query DevTools
- Check browser network tab
- Add console logs in query functions
- Verify query keys are correct
