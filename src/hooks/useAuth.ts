import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import { changePassword, getMe, login, logout, register, updateProfile } from "@/services/auth";

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
