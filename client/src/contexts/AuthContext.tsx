import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData, ChangePasswordData } from '../services/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
    updateProfile: (nome: string, cognome: string) => Promise<void>;
    changePassword: (data: ChangePasswordData) => Promise<void>;
    forgotPassword: (email: string) => Promise<{ message: string; resetToken?: string }>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Carica il token dal localStorage all'avvio
        const initializeAuth = async () => {
            const savedToken = authService.getToken();
            const savedUser = authService.getCurrentUser();

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(savedUser);

                // Verifica che il token sia ancora valido facendo una chiamata al profilo
                try {
                    const profileResponse = await authService.getProfile();
                    // Se la chiamata ha successo, aggiorna i dati utente
                    setUser(profileResponse.user);
                    localStorage.setItem('auth_user', JSON.stringify(profileResponse.user));
                } catch (error) {
                    // Se il token non è valido, pulisci i dati direttamente
                    console.log('Token non valido, pulizia automatica');
                    setUser(null);
                    setToken(null);
                    authService.logout();
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);

            setUser(response.user);
            setToken(response.token);

            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(response.user));
        } catch (error) {
            // L'errore viene gestito dal componente chiamante
            throw error;
        }
    };

    const loginWithGoogle = async (credential: string) => {
        try {
            const response = await authService.loginWithGoogle(credential);

            setUser(response.user);
            setToken(response.token);

            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(response.user));
        } catch (error) {
            // L'errore viene gestito dal componente chiamante
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await authService.register(data);

            setUser(response.user);
            setToken(response.token);

            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('auth_user', JSON.stringify(response.user));
        } catch (error) {
            // L'errore viene gestito dal componente chiamante
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        authService.logout();
    };

    const updateProfile = async (nome: string, cognome: string) => {
        if (!user) throw new Error('Utente non autenticato');

        try {
            const response = await authService.updateProfile(nome, cognome);
            const updatedUser = response.user;
            setUser(updatedUser);
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        } catch (error) {
            throw error;
        }
    };

    const changePassword = async (data: ChangePasswordData) => {
        try {
            await authService.changePassword(data);
        } catch (error) {
            throw error;
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            const response = await authService.forgotPassword(email);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const resetPassword = async (token: string, newPassword: string) => {
        try {
            await authService.resetPassword({ token, newPassword });
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        token,
        login,
        loginWithGoogle,
        register,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
