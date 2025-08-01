import { useQuery, useMutation, useQueryClient } from "react-query";
import { apiService } from "@/lib/api";

// Types
export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    image?: string;
}

// Query keys
export const serviceKeys = {
    all: ["services"] as const,
    lists: () => [...serviceKeys.all, "list"] as const,
    list: (filters: string) => [...serviceKeys.lists(), { filters }] as const,
    details: () => [...serviceKeys.all, "detail"] as const,
    detail: (id: string) => [...serviceKeys.details(), id] as const,
};

// Hooks
export const useServices = () => {
    return useQuery({
        queryKey: serviceKeys.lists(),
        queryFn: async (): Promise<Service[]> => {
            const response = await apiService.getServices();
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useService = (id: string) => {
    return useQuery({
        queryKey: serviceKeys.detail(id),
        queryFn: async (): Promise<Service> => {
            const response = await apiService.getService(id);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serviceData: Omit<Service, "id">) => {
            // Note: This would need to be implemented in the API service
            // For now, this is a placeholder
            throw new Error("Create service not implemented in API service");
        },
        onSuccess: () => {
            // Invalidate and refetch services list
            queryClient.invalidateQueries(serviceKeys.lists());
        },
    });
};

export const useUpdateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...serviceData }: Partial<Service> & { id: string }) => {
            // Note: This would need to be implemented in the API service
            // For now, this is a placeholder
            throw new Error("Update service not implemented in API service");
        },
        onSuccess: (data, variables) => {
            // Update the cache with the new data
            queryClient.setQueryData(serviceKeys.detail(variables.id), data);
            // Invalidate the list to refetch
            queryClient.invalidateQueries(serviceKeys.lists());
        },
    });
};

export const useDeleteService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Note: This would need to be implemented in the API service
            // For now, this is a placeholder
            throw new Error("Delete service not implemented in API service");
        },
        onSuccess: (deletedId) => {
            // Remove the deleted service from cache
            queryClient.removeQueries(serviceKeys.detail(deletedId));
            // Invalidate the list to refetch
            queryClient.invalidateQueries(serviceKeys.lists());
        },
    });
}; 