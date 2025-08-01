"use client";

import { useSession, signOut } from "next-auth/react";

export const useAuth = () => {
    const { data: session, status } = useSession();

    const logout = async () => {
        try {
            // Clear all cache and storage
            if (typeof window !== 'undefined') {
                // Clear localStorage
                localStorage.clear();
                // Clear sessionStorage
                sessionStorage.clear();
                // Clear all cookies
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                // Clear IndexedDB if available
                if ('indexedDB' in window) {
                    const databases = await window.indexedDB.databases();
                    databases.forEach(db => {
                        if (db.name) {
                            window.indexedDB.deleteDatabase(db.name);
                        }
                    });
                }
            }

            // Sign out from NextAuth
            await signOut({ redirect: false });

            // Force a hard redirect to clear all React state
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback navigation
            window.location.href = "/login";
        }
    };

    return {
        user: session?.user,
        isAuthenticated: !!session?.user,
        isLoading: status === "loading",
        logout,
        accessToken: session?.accessToken,
    };
}; 