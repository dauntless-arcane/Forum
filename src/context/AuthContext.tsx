import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const checkAuth = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const { data } = await auth.getMe();
                setUser(data.user);
                setToken(storedToken);
            } catch (error) {
                console.error('Auth verification failed:', error);
                logout();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                loading,
                login,
                logout,
                checkAuth,
                setUser,
            }}
        >
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
