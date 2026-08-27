import {User} from "./user";

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => Promise<void>;
    applyToken: (access: string, refresh?: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    authError: string | null;
    clearError: () => void;
    isAuthenticated: boolean;
}
