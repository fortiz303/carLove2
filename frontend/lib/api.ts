const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
}

export interface Address {
    _id: string;
    type: 'home' | 'work' | 'other';
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    addresses?: Address[];
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface RegisterData {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface SupportTicket {
    _id: string;
    user: {
        _id: string;
        fullName: string;
        email: string;
    } | string;
    booking?: string;
    subject: string;
    description: string;
    category: 'booking' | 'payment' | 'service' | 'technical' | 'general' | 'complaint' | 'suggestion';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    assignedTo?: {
        _id: string;
        fullName: string;
    } | string;
    messages: Array<{
        author: string;
        content: string;
        isInternal: boolean;
        attachments?: Array<{
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            url: string;
        }>;
        createdAt: string;
    }>;
    resolvedBy?: string;
    resolvedAt?: string;
    resolution?: string;
    satisfaction?: number;
    feedback?: string;
    tags?: string[];
    sla: {
        targetResolutionHours: number;
        firstResponseAt?: string;
        resolvedAt?: string;
        isOverdue: boolean;
    };
    escalatedTo?: string;
    escalatedAt?: string;
    escalationReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTicketData {
    subject: string;
    description: string;
    category: SupportTicket['category'];
    priority?: SupportTicket['priority'];
    booking?: string;
}

export interface TicketResponse {
    content: string;
    isInternal?: boolean;
}

export interface SatisfactionData {
    rating: number;
    feedback?: string;
}

class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        accessToken?: string
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        console.log("API Request - URL:", url);
        console.log("API Request - Options:", options);
        console.log("API Request - Token:", accessToken ? "Present" : "Missing");

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available
        if (accessToken) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${accessToken}`,
            };
        }

        try {
            console.log("API Request - Making fetch request");
            const response = await fetch(url, config);
            console.log("API Request - Response status:", response.status);
            const data = await response.json();
            console.log("API Request - Response data:", data);

            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }

            return data;
        } catch (error) {
            console.error("API Request - Error:", error);
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Network error');
        }
    }

    // Auth methods
    async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMe(accessToken: string): Promise<ApiResponse<User>> {
        return this.request<User>('/auth/me', {}, accessToken);
    }

    async logout(accessToken: string): Promise<ApiResponse> {
        return this.request('/auth/logout', {
            method: 'POST',
        }, accessToken);
    }

    // User profile methods
    async getProfile(accessToken: string): Promise<ApiResponse<{ user: User }>> {
        return this.request<{ user: User }>('/user/profile', {}, accessToken);
    }

    async updateProfile(data: Partial<User>, accessToken: string): Promise<ApiResponse<User>> {
        return this.request<User>('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, accessToken);
    }

    // Address methods
    async getAddresses(accessToken: string): Promise<ApiResponse> {
        return this.request('/user/addresses', {}, accessToken);
    }

    async addAddress(data: any, accessToken: string): Promise<ApiResponse> {
        return this.request('/user/addresses', {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async updateAddress(addressId: string, data: any, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async deleteAddress(addressId: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/addresses/${addressId}`, {
            method: 'DELETE',
        }, accessToken);
    }

    async setDefaultAddress(addressId: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/addresses/${addressId}/default`, {
            method: 'PUT',
        }, accessToken);
    }

    // Booking methods
    async createBooking(data: any, accessToken: string): Promise<ApiResponse> {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async getBookings(accessToken: string): Promise<ApiResponse> {
        return this.request('/bookings', {}, accessToken);
    }

    async getAdminBookings(accessToken: string, params?: string): Promise<ApiResponse> {
        const url = params ? `/bookings/admin/all?${params}` : '/bookings/admin/all';
        return this.request(url, {}, accessToken);
    }

    async testAdminBookings(accessToken: string): Promise<ApiResponse> {
        return this.request('/bookings/admin/test', {}, accessToken);
    }

    async getBooking(id: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/bookings/${id}`, {}, accessToken);
    }

    async cancelBooking(id: string, accessToken: string, reason?: string): Promise<ApiResponse> {
        return this.request(`/bookings/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }, accessToken);
    }

    async rescheduleBooking(id: string, scheduledDate: string, scheduledTime: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/bookings/${id}/reschedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scheduledDate, scheduledTime }),
        }, accessToken);
    }

    async addReview(id: string, rating: number, review: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/bookings/${id}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating, review }),
        }, accessToken);
    }

    // Admin booking management methods
    async acceptBooking(id: string, accessToken: string, assignedStaff?: string, notes?: string): Promise<ApiResponse> {
        return this.request(`/bookings/admin/${id}/accept`, {
            method: 'POST',
            body: JSON.stringify({ assignedStaff, notes }),
        }, accessToken);
    }

    async rejectBooking(id: string, reason: string, accessToken: string, refundAmount?: number): Promise<ApiResponse> {
        return this.request(`/bookings/admin/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason, refundAmount }),
        }, accessToken);
    }

    async adminCancelBooking(id: string, reason: string, offerReschedule: boolean, accessToken: string, refundAmount?: number): Promise<ApiResponse> {
        return this.request(`/bookings/admin/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason, offerReschedule, refundAmount }),
        }, accessToken);
    }

    async getRescheduleSlots(id: string, date: string, duration: number, accessToken: string): Promise<ApiResponse> {
        return this.request(`/bookings/admin/${id}/available-slots?date=${date}&duration=${duration}`, {}, accessToken);
    }

    async completeBooking(id: string, completionNotes: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/bookings/admin/${id}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completionNotes }),
        }, accessToken);
    }

    // Service methods
    async getServices(): Promise<ApiResponse> {
        return this.request('/services');
    }

    async getService(id: string): Promise<ApiResponse> {
        return this.request(`/services/${id}`);
    }

    async getServicesByName(name: string): Promise<ApiResponse> {
        return this.request(`/services?name=${encodeURIComponent(name)}`);
    }

    async seedDefaultServices(accessToken: string): Promise<ApiResponse> {
        return this.request('/services/seed', {
            method: 'POST',
        }, accessToken);
    }

    // Support ticket methods
    async createSupportTicket(data: any, accessToken: string): Promise<ApiResponse> {
        return this.request('/support/tickets', {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async getSupportTickets(accessToken: string, params?: any): Promise<ApiResponse> {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.request(`/support/tickets${queryParams}`, {}, accessToken);
    }

    async getSupportTicket(id: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/tickets/${id}`, {}, accessToken);
    }

    async respondToTicket(id: string, data: any, accessToken: string): Promise<ApiResponse> {
        console.log("API Service - respondToTicket called");
        console.log("ID:", id);
        console.log("Data:", data);
        console.log("Token:", accessToken ? "Present" : "Missing");

        return this.request(`/support/tickets/${id}/respond`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async closeTicket(id: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/tickets/${id}/close`, {
            method: 'POST',
        }, accessToken);
    }

    async addSatisfaction(id: string, data: any, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/tickets/${id}/satisfaction`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    // Admin support ticket methods
    async getAdminTickets(accessToken: string, params?: any): Promise<ApiResponse> {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.request(`/support/admin/tickets${queryParams}`, {}, accessToken);
    }

    async assignTicket(id: string, data: { assignedTo: string }, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/admin/tickets/${id}/assign`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async resolveTicket(id: string, data: { resolution?: string }, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/admin/tickets/${id}/resolve`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async escalateTicket(id: string, data: { escalatedTo: string; reason: string }, accessToken: string): Promise<ApiResponse> {
        return this.request(`/support/admin/tickets/${id}/escalate`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async getSupportStats(accessToken: string): Promise<ApiResponse> {
        return this.request('/support/admin/stats', {}, accessToken);
    }

    // Admin dashboard methods
    async getAdminDashboardStats(accessToken: string): Promise<ApiResponse> {
        return this.request('/admin/dashboard', {}, accessToken);
    }

    // Payment methods
    async createPaymentIntent(bookingId: string, accessToken: string): Promise<ApiResponse> {
        return this.request('/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify({ bookingId }),
        }, accessToken);
    }

    async confirmPayment(paymentIntentId: string, accessToken: string): Promise<ApiResponse> {
        return this.request('/payments/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentIntentId }),
        }, accessToken);
    }

    async getPaymentMethods(accessToken: string): Promise<ApiResponse> {
        return this.request('/payments/methods', {}, accessToken);
    }

    async addPaymentMethod(paymentMethodId: string, accessToken: string): Promise<ApiResponse> {
        return this.request('/payments/methods', {
            method: 'POST',
            body: JSON.stringify({ paymentMethodId }),
        }, accessToken);
    }

    async removePaymentMethod(paymentMethodId: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/payments/methods/${paymentMethodId}`, {
            method: 'DELETE',
        }, accessToken);
    }

    // Vehicle methods
    async getVehicles(accessToken: string): Promise<ApiResponse> {
        return this.request('/user/vehicles', {}, accessToken);
    }

    async addVehicle(data: any, accessToken: string): Promise<ApiResponse> {
        return this.request('/user/vehicles', {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async updateVehicle(vehicleId: string, data: any, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/vehicles/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async deleteVehicle(vehicleId: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/vehicles/${vehicleId}`, {
            method: 'DELETE',
        }, accessToken);
    }

    async setDefaultVehicle(vehicleId: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/user/vehicles/${vehicleId}/default`, {
            method: 'PUT',
        }, accessToken);
    }

    async getDefaultVehicle(accessToken: string): Promise<ApiResponse> {
        return this.request('/user/vehicles/default', {}, accessToken);
    }

    // Promo code methods
    async validatePromoCode(code: string, orderAmount: number, serviceIds: string[], accessToken: string): Promise<ApiResponse> {
        return this.request('/promo-codes/validate', {
            method: 'POST',
            body: JSON.stringify({ code, orderAmount, serviceIds }),
        }, accessToken);
    }

    // Admin promo code methods
    async createPromoCode(data: any, accessToken: string): Promise<ApiResponse> {
        return this.request('/admin/promo-codes', {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async getPromoCodes(accessToken: string, params?: string): Promise<ApiResponse> {
        return this.request(`/admin/promo-codes${params ? `?${params}` : ''}`, {}, accessToken);
    }

    async getPromoCode(id: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/admin/promo-codes/${id}`, {}, accessToken);
    }

    async updatePromoCode(id: string, data: any, accessToken: string): Promise<ApiResponse> {
        return this.request(`/admin/promo-codes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, accessToken);
    }

    async deletePromoCode(id: string, accessToken: string): Promise<ApiResponse> {
        return this.request(`/admin/promo-codes/${id}`, {
            method: 'DELETE',
        }, accessToken);
    }

    async getPromoCodeStats(accessToken: string): Promise<ApiResponse> {
        return this.request('/admin/promo-codes/stats', {}, accessToken);
    }

    // Pricing methods
    async calculatePricing(data: {
        selectedServiceId: number;
        selectedExtras?: string[];
        vehicleType?: string;
        frequency?: string;
        promoCode?: string;
    }): Promise<ApiResponse> {
        return this.request('/pricing/calculate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getPricingServices(vehicleType?: string): Promise<ApiResponse> {
        const params = vehicleType ? `?vehicleType=${vehicleType}` : '';
        return this.request(`/pricing/services${params}`);
    }

    async validatePricingPromoCode(data: {
        promoCode: string;
        subtotal: number;
        serviceIds?: string[];
    }): Promise<ApiResponse> {
        return this.request('/pricing/validate-promo', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getPricingConfig(): Promise<ApiResponse> {
        return this.request('/pricing/config');
    }

    // Subscription methods
    async createSubscription(data: any, token: string): Promise<ApiResponse> {
        return this.request('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token);
    }

    async getUserSubscriptions(token: string): Promise<ApiResponse> {
        return this.request('/subscriptions', {}, token);
    }

    async cancelSubscription(subscriptionId: string, reason: string, token: string): Promise<ApiResponse> {
        return this.request(`/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }, token);
    }

    async pauseSubscription(subscriptionId: string, token: string): Promise<ApiResponse> {
        return this.request(`/subscriptions/${subscriptionId}/pause`, {
            method: 'POST',
        }, token);
    }

    async resumeSubscription(subscriptionId: string, token: string): Promise<ApiResponse> {
        return this.request(`/subscriptions/${subscriptionId}/resume`, {
            method: 'POST',
        }, token);
    }
}

export const apiService = new ApiService(); 