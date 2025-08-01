import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            phone?: string;
        };
        accessToken: string;
    }

    interface User {
        id: string;
        name: string;
        email: string;
        phone?: string;
        role: string;
        accessToken: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string;
        role: string;
        phone?: string;
    }
} 