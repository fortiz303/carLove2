import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { useBooking } from '@/contexts/BookingContext';

export interface PricingData {
    subtotal: number;
    discountedSubtotal: number;
    tax: number;
    total: number;
    frequencyDiscount: number;
    finalDiscount: number;
}

export interface ServiceDetails {
    name: string;
    basePrice: number;
    currentPrice: number;
    duration: number;
    category: string;
    description: string;
    features: string[];
}

export interface AddonDetails {
    name: string;
    basePrice: number;
    currentPrice: number;
    duration: number;
    category: string;
    description: string;
    canCombineWith: string[];
}

export interface PricingResponse {
    pricing: PricingData;
    serviceDetails: ServiceDetails;
    addonDetails: AddonDetails[];
    promoCodeValidation: {
        valid: boolean;
        message: string;
        discountAmount?: number;
        finalAmount?: number;
    } | null;
    frequency: string;
}

export const usePricing = () => {
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
    const [addonDetails, setAddonDetails] = useState<AddonDetails[]>([]);
    const [promoCodeValidation, setPromoCodeValidation] = useState<any>(null);

    const {
        selectedServiceId,
        selectedExtras,
        selectedFrequency,
        promoCode,
        carDetails,
        setPricing: setBookingPricing
    } = useBooking();

    // Calculate pricing when dependencies change
    const calculatePricing = useCallback(async () => {
        if (!selectedServiceId) {
            setPricing(null);
            setServiceDetails(null);
            setAddonDetails([]);
            setPromoCodeValidation(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.calculatePricing({
                selectedServiceId,
                selectedExtras,
                frequency: selectedFrequency,
                promoCode
            });

            if (response.success && response.data) {
                const { pricing, serviceDetails, addonDetails, promoCodeValidation } = response.data;

                setPricing(pricing);
                setServiceDetails(serviceDetails);
                setAddonDetails(addonDetails);
                setPromoCodeValidation(promoCodeValidation);

                // Update booking context pricing
                setBookingPricing(pricing);
            } else {
                setError(response.message || 'Failed to calculate pricing');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to calculate pricing');
        } finally {
            setLoading(false);
        }
    }, [selectedServiceId, selectedExtras, selectedFrequency, promoCode, setBookingPricing]);

    // Calculate pricing on dependency changes
    useEffect(() => {
        calculatePricing();
    }, [calculatePricing]);

    // Validate promo code separately
    const validatePromoCode = useCallback(async (code: string) => {
        if (!pricing || !code) return;

        try {
            const response = await apiService.validatePricingPromoCode({
                promoCode: code,
                subtotal: pricing.subtotal
            });

            if (response.success) {
                setPromoCodeValidation(response.data);
                return response.data;
            } else {
                setError(response.message || 'Invalid promo code');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate promo code');
            return null;
        }
    }, [pricing]);

    // Get service details for display
    const getServiceDisplayInfo = useCallback(() => {
        if (!serviceDetails) return null;

        return {
            name: serviceDetails.name,
            price: serviceDetails.currentPrice,
            duration: serviceDetails.duration,
            description: serviceDetails.description,
            features: serviceDetails.features
        };
    }, [serviceDetails]);

    // Get addon display info
    const getAddonDisplayInfo = useCallback(() => {
        return addonDetails.map(addon => ({
            name: addon.name,
            price: addon.currentPrice,
            duration: addon.duration,
            description: addon.description
        }));
    }, [addonDetails]);

    // Calculate savings
    const getSavings = useCallback(() => {
        if (!pricing) return 0;

        const frequencySavings = pricing.frequencyDiscount;
        const promoSavings = promoCodeValidation?.discountAmount || 0;

        return frequencySavings + promoSavings;
    }, [pricing, promoCodeValidation]);

    // Get final total
    const getFinalTotal = useCallback(() => {
        if (!pricing) return 0;

        if (promoCodeValidation?.valid && promoCodeValidation.finalAmount) {
            return promoCodeValidation.finalAmount;
        }

        return pricing.total;
    }, [pricing, promoCodeValidation]);

    return {
        pricing,
        loading,
        error,
        serviceDetails,
        addonDetails,
        promoCodeValidation,
        calculatePricing,
        validatePromoCode,
        getServiceDisplayInfo,
        getAddonDisplayInfo,
        getSavings,
        getFinalTotal,
        clearError: () => setError(null)
    };
};
