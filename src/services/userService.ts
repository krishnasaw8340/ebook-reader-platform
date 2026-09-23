import { api } from './api';

export interface UpdateUserProfilePayload {
    fullName?: string;
    username?: string;
    avatarUrl?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface UserProfileResponse {
    id: string;
    email: string;
    username?: string;
    fullName: string;
    avatarUrl?: string;
    isEmailVerified: boolean;
    status: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}

export const userService = {
    /**
     * GET /users/me
     * Fetch the safe profile of the current logged-in user
     */
    getProfile: async (): Promise<UserProfileResponse> => {
        const response = await api.get<UserProfileResponse>('/users/me');
        return response.data;
    },

    /**
     * PATCH /users/me
     * Update display name, handle, or avatar
     */
    updateProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfileResponse> => {
        const response = await api.patch<UserProfileResponse>('/users/me', payload);
        return response.data;
    },

    /**
     * PATCH /users/me/password
     * Change password and revoke all active refresh sessions
     */
    changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
        const response = await api.patch<{ message: string }>('/users/me/password', payload);
        return response.data;
    },
};
