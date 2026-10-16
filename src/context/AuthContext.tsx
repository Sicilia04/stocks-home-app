import React, {createContext, useState, useContext, ReactNode, useEffect, useRef} from 'react';
import * as SecureStore from 'expo-secure-store';
import {AuthContextType} from "../types/auth";
import {User} from "../types/user";
import {setUnauthorizedHandler} from "../api/axiosInstance";


const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'userToken';
const REFRESH_KEY = 'userRefresh';
const USER_KEY = 'user';

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // signals that session restore is in progress
    const [authError, setAuthError] = useState<string | null>(null); // auth error state

    // Imperative logout (no setStates to await) so it can be called from the 401 interceptor
    const forceLogout = () => {
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
        SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
    };

    const forceLogoutRef = useRef(forceLogout);
    forceLogoutRef.current = forceLogout;

    // Register the Axios 401 handler: any expired session clears the state
    useEffect(() => {
        setUnauthorizedHandler(() => forceLogoutRef.current());
        return () => setUnauthorizedHandler(null);
    }, []);

    // Restore the session on startup
    useEffect(() => {
        (async () => {
            const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            const storedUser = await SecureStore.getItemAsync(USER_KEY);
            if (storedToken && storedUser) {
                setIsAuthenticated(true);
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        })();
    }, []);

    // Stores the token (and optional refresh) WITHOUT touching the session state.
    // Used to have the token persisted BEFORE an authenticated API call (e.g. GET /users/me/).
    const applyToken = async (access: string, refresh?: string) => {
        await SecureStore.setItemAsync(TOKEN_KEY, access);
        if (refresh) {
            await SecureStore.setItemAsync(REFRESH_KEY, refresh);
        }
        setToken(access);
    };

    // Login: stores the token and updates the authenticated status
    const login = async (token: string, user: User) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
            setIsAuthenticated(true);
            setUser(user);
            setToken(token);
            setAuthError(null);
        } catch (e) {
            console.error(e);
            setAuthError("Erreur lors de la connexion sécurisée");
        }
    };

    // Logout: deletes the tokens and updates the status
    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
        } catch (e) {
            setAuthError('Erreur lors de la déconnexion');
        }
    };

    const clearError = () => {
        setAuthError(null);
    };

    return (
        <AuthContext.Provider value={{user, token, isAuthenticated, authError, login, logout, clearError, loading, applyToken}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
