import { AuthProvider } from "@refinedev/core";
import { AuthHelper } from "@refinedev/strapi";
import axios from "axios";

const strapiAuthProvider = (apiUrl: string) => {
    const axiosInstance = axios.create();

    const TOKEN_KEY = "refine-auth";
    const strapiAuthHelper = AuthHelper(apiUrl);

    const authProvider: AuthProvider = {
        login: async ({ email, password }) => {
            const { data, status, statusText } = await strapiAuthHelper.login(
                email,
                password,
            );
            if (status === 200) {
                localStorage.setItem(TOKEN_KEY, data.jwt);

                // set header axios instance
                axiosInstance.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${data.jwt}`;

                return {
                    success: true,
                    redirectTo: "/",
                };
            }
            return {
                success: false,
                error: new Error(statusText),
            };
        },
        logout: async () => {
            localStorage.removeItem(TOKEN_KEY);
            return { redirectTo: "/login", success: true };
        },
        onError: async (error) => {
            console.error(error);
            return { error };
        },
        check: async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                axiosInstance.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${token}`;
                return {
                    authenticated: true,
                };
            }

            return {
                authenticated: false,
                logout: true,
                error: {
                    message: "Check failed",
                    name: "Token not found",
                },
                redirectTo: "/login",
            };
        },
        getPermissions: async () => null,
        getIdentity: async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                return null;
            }

            const { data, status } = await strapiAuthHelper.me(token);
            if (status === 200) {
                const { id, username, email } = data;
                return {
                    id,
                    username,
                    email,
                };
            }

            return null;
        },
    };

    return {
        authProvider,
        axiosInstance,
    };
};

export default strapiAuthProvider;
