const ACCESS_TOKEN_KEY = "fshop_access_token";
const AUTH_USER_KEY = "fshop_auth_user";

export const authStorage = {
    getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    setAccessToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
    removeAccessToken: () => localStorage.removeItem(ACCESS_TOKEN_KEY),

    getUser: <T>() => {
        const raw = localStorage.getItem(AUTH_USER_KEY);
        return raw ? (JSON.parse(raw) as T) : null;
    },
    setUser: (user: unknown) => localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
    removeUser: () => localStorage.removeItem(AUTH_USER_KEY),

    clear: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
    },
};
