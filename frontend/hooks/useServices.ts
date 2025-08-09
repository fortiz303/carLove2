import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  isActive: boolean;
  image: string;
  features: string[];
  requirements: string[];
}

export interface ServiceMapping {
  [key: number]: string; // frontend ID -> backend ObjectId
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceMapping, setServiceMapping] = useState<ServiceMapping>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getServices();

        if (response.success && response.data?.services) {
          const fetchedServices = response.data.services;
          setServices(fetchedServices);

          // Create mapping from frontend IDs to backend ObjectIds
          const mapping: ServiceMapping = {};
          fetchedServices.forEach((service: Service) => {
            // Map service names to frontend IDs based on the detailingOptions
            if (service.name === "Interior Only") {
              mapping[1] = service._id;
            } else if (service.name === "Exterior Only") {
              mapping[2] = service._id;
            } else if (service.name === "Full Detail") {
              mapping[3] = service._id;
            }
          });

          setServiceMapping(mapping);
        } else {
          setError(response.message || 'Failed to fetch services');
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getServiceById = (id: string) => {
    return services.find(service => service._id === id);
  };

  const getServiceByFrontendId = (frontendId: number) => {
    const backendId = serviceMapping[frontendId];
    if (backendId) {
      return getServiceById(backendId);
    }
    return null;
  };

  return {
    services,
    serviceMapping,
    loading,
    error,
    getServiceById,
    getServiceByFrontendId,
  };
}; 