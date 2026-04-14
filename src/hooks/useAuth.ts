import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    changePassword,
    getMe,
    linkGoogleAccount,
    login,
    loginWithGoogle,
    logout,
    register,
    requestForgotPassword,
    resetForgotPassword,
    unlinkGoogleAccount,
    updateProfile,
    verifyForgotPasswordCode,
} from "@/services/auth";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export const useMe = () => {
    return useQuery({
        queryKey: AUTH_ME_QUERY_KEY,
        queryFn: getMe,
        enabled: Boolean(authStorage.getAccessToken()),
        staleTime: 60_000,
    });
};

export const useLogin = () => {
    return useMutation({
        mutationFn: login,
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: register,
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            authStorage.clear();
            queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: (response) => {
            authStorage.setUser(response.data);
            queryClient.setQueryData(AUTH_ME_QUERY_KEY, response);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: changePassword,
    });
};

export const useLoginWithGoogle = () => {
    return useMutation({
        mutationFn: loginWithGoogle,
    });
};

export const useLinkGoogleAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: linkGoogleAccount,
        onSuccess: (response) => {
            authStorage.setUser(response.user);
            queryClient.setQueryData(AUTH_ME_QUERY_KEY, response);
            queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
        },
    });
};

export const useUnlinkGoogleAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unlinkGoogleAccount,
        onSuccess: (response) => {
            authStorage.setUser(response.user);
            queryClient.setQueryData(AUTH_ME_QUERY_KEY, response);
            queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
        },
    });
};

export const useForgotPasswordRequest = () => {
    return useMutation({
        mutationFn: requestForgotPassword,
    });
};

export const useForgotPasswordVerify = () => {
    return useMutation({
        mutationFn: verifyForgotPasswordCode,
    });
};

export const useForgotPasswordReset = () => {
    return useMutation({
        mutationFn: resetForgotPassword,
    });
};
