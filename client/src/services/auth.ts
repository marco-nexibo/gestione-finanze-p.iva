import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor per aggiungere automaticamente il token di autorizzazione
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor per gestire errori di autenticazione
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token scaduto o non valido, rimuovi i dati di autenticazione
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Non ricaricare automaticamente la pagina, lascia che sia l'AuthContext a gestirlo
        }
        return Promise.reject(error);
    }
);

export interface User {
    id: number;
    email: string;
    nome: string;
    cognome: string;
    tenant_id: number;
    role: string;
    onboarding_completed: boolean;
    subscription_status: string;
    subscription_end_date: number | null;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    nome: string;
    cognome: string;
}

export interface ForgotPasswordResponse {
    message: string;
    resetToken?: string; // Solo in development
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export const authService = {
    // Login
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', credentials);
        return response.data;
    },

    // Login con Google
    loginWithGoogle: async (credential: string): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/google', { credential });
        return response.data;
    },

    // Registrazione
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    // Richiesta reset password
    forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
        const response = await api.post('/api/auth/reset-password', data);
        return response.data;
    },

    // Ottieni profilo utente corrente
    getProfile: async (): Promise<{ user: User }> => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    },

    // Aggiorna profilo utente
    updateProfile: async (nome: string, cognome: string): Promise<{ message: string; user: User }> => {
        const response = await api.put('/api/auth/profile', { nome, cognome });
        return response.data;
    },

    // Cambio password
    changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
        const response = await api.put('/api/auth/change-password', data);
        return response.data;
    },

    // Logout (lato client)
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },

    // Verifica se l'utente è autenticato
    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');
        return !!(token && user);
    },

    // Ottieni token corrente
    getToken: (): string | null => {
        return localStorage.getItem('auth_token');
    },

    // Ottieni utente corrente dal localStorage
    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('auth_user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },
};
