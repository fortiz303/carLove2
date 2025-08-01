import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


const authOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        return {
                            id: data.data.user.id,
                            name: data.data.user.fullName,
                            email: data.data.user.email,
                            phone: data.data.user.phone,
                            role: data.data.user.role,
                            accessToken: data.data.token,
                        };
                    }

                    // Handle validation errors
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map((err: any) => err.message).join(', ');
                        throw new Error(errorMessages);
                    }

                    // Throw error with the specific message from backend
                    throw new Error(data.message || "Invalid credentials");
                } catch (error) {
                    console.error('Auth error:', error);
                    if (error instanceof Error) {
                        throw error;
                    }
                    throw new Error("Authentication failed");
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }: { token: any, user: any, account: any }) {
            // Initial sign in
            if (account && user) {
                if (account.provider === "credentials") {
                    token.accessToken = user.accessToken;
                    token.role = user.role;
                    token.phone = user.phone;
                } else {
                    // OAuth sign in - handle with your backend
                    try {
                        const response = await fetch(`${API_BASE_URL}/auth/${account.provider}/callback`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                access_token: account.access_token,
                                provider: account.provider,
                                user: {
                                    name: user.name,
                                    email: user.email,
                                    image: user.image,
                                },
                            }),
                        });

                        const data = await response.json();
                        if (response.ok && data.success) {
                            token.accessToken = data.data.token;
                            token.role = data.data.user.role;
                            token.phone = data.data.user.phone;
                        }
                    } catch (error) {
                        console.error('OAuth callback error:', error);
                    }
                }
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (token) {
                session.user.id = token.sub!;
                session.user.role = token.role as string;
                session.user.phone = token.phone as string;
                session.accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        signOut: '/logout',
        error: '/error',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
} as NextAuthOptions;

export default authOptions;