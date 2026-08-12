import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    authApi,
    type LoginPayload,
    type RegisterPayload,
    type VerifyEmailPayload,
    type ResetPasswordPayload,
    type JwtUser,
} from '../services/authApi';

interface AuthContextType {
    user: JwtUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<{ message: string; email: string }>;
    verifyEmail: (payload: VerifyEmailPayload) => Promise<{ message: string }>;
    forgotPassword: (email: string) => Promise<{ message: string }>;
    resetPassword: (payload: ResetPasswordPayload) => Promise<{ message: string }>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<JwtUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('ky_access_token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('ky_refresh_token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const clearAuthState = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('ky_access_token');
        localStorage.removeItem('ky_refresh_token');
    }, []);

    // Initial boot token check and user profile fetch
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('ky_access_token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const profile = await authApi.getMe();
                setUser(profile);
            } catch {
                clearAuthState();
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();

        // Global unauthorized event listener triggered by axios interceptor
        const handleUnauthorized = () => {
            clearAuthState();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [clearAuthState]);

    const login = async (payload: LoginPayload) => {
        setIsLoading(true);
        try {
            const response = await authApi.login(payload);
            setAccessToken(response.accessToken);
            setRefreshToken(response.refreshToken);
            localStorage.setItem('ky_access_token', response.accessToken);
            localStorage.setItem('ky_refresh_token', response.refreshToken);

            // Fetch profile
            const profile = await authApi.getMe();
            setUser(profile);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (payload: RegisterPayload) => {
        setIsLoading(true);
        try {
            return await authApi.register(payload);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (payload: VerifyEmailPayload) => {
        setIsLoading(true);
        try {
            return await authApi.verifyEmail(payload);
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        setIsLoading(true);
        try {
            return await authApi.forgotPassword(email);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (payload: ResetPasswordPayload) => {
        setIsLoading(true);
        try {
            return await authApi.resetPassword(payload);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        const storedRefresh = localStorage.getItem('ky_refresh_token');
        try {
            if (storedRefresh) {
                await authApi.logout(storedRefresh);
            }
        } catch {
            // Ignore API error on logout cleanup
        } finally {
            clearAuthState();
        }
    };

    const logoutAll = async () => {
        try {
            await authApi.logoutAll();
        } catch {
            // Ignore API error on logout cleanup
        } finally {
            clearAuthState();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                verifyEmail,
                forgotPassword,
                resetPassword,
                logout,
                logoutAll,
                clearError: () => {},
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
