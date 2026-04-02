export const resolveSocketBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiUrl) {
        return window.location.origin;
    }

    try {
        return new URL(apiUrl).origin;
    } catch {
        return apiUrl;
    }
};
