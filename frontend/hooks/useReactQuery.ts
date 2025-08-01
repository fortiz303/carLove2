import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
    UseQueryOptions,
    UseMutationOptions,
    UseInfiniteQueryOptions,
} from "react-query";

// Re-export commonly used hooks
export {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
};

// Export types for better TypeScript support
export type {
    UseQueryOptions,
    UseMutationOptions,
    UseInfiniteQueryOptions,
};

// Custom hook for invalidating queries
export const useInvalidateQueries = () => {
    const queryClient = useQueryClient();

    return {
        invalidateQueries: (queryKey: string | string[]) => {
            return queryClient.invalidateQueries(queryKey);
        },
        removeQueries: (queryKey: string | string[]) => {
            return queryClient.removeQueries(queryKey);
        },
        resetQueries: (queryKey: string | string[]) => {
            return queryClient.resetQueries(queryKey);
        },
    };
}; 