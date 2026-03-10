import axios from "axios";
import { authStorage } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";
import type { RefreshTokenResponse } from "@/types/auth";

const BE_URL = import.meta.env.VITE_API_URL || "https://api.example.com";

const axiosInstance = axios.create({
    baseURL: BE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = authStorage.getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const normalizeAxiosErrorMessage = (rawError: unknown) => {
            if (axios.isAxiosError(rawError)) {
                rawError.message = extractApiErrorMessage(rawError.response?.data, rawError.message);
            }
            return rawError;
        };

        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

        if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
            return Promise.reject(normalizeAxiosErrorMessage(error));
        }

        // Avoid infinite loop when refresh endpoint itself returns 401.
        if (String(originalRequest.url || "").includes("/auth/refresh-token")) {
            authStorage.clear();
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            return Promise.reject(normalizeAxiosErrorMessage(error));
        }

        originalRequest._retry = true;

        try {
            const { data } = await axios.post<RefreshTokenResponse>(
                `${BE_URL}/auth/refresh-token`,
                {},
                { withCredentials: true }
            );

            authStorage.setAccessToken(data.accessToken);
            originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${data.accessToken}`,
            };

            return axiosInstance(originalRequest);
        } catch (refreshError) {
            authStorage.clear();
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            return Promise.reject(normalizeAxiosErrorMessage(refreshError));
        }
    }
);

export default axiosInstance;