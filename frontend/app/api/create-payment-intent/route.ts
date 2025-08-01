import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json(
                { success: false, message: 'Booking ID is required' },
                { status: 400 }
            );
        }

        // Get the authorization header from the request
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json(
                { success: false, message: 'Authorization header is required' },
                { status: 401 }
            );
        }

        // Forward the request to the backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${backendUrl}/payments/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ bookingId }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Failed to create payment intent' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Create payment intent error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
} 