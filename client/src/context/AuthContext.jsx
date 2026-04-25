import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Error parsing user data from localStorage", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            toast({ title: 'Success', description: 'Logged in successfully' });
            return data.user;
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Login failed',
                variant: 'destructive',
            });
            return null;
        }
    };

    const register = async (email, password) => {
        try {
            await api.post('/auth/register', { email, password });
            toast({ title: 'Success', description: 'Account created. Please login.' });
            return true;
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Registration failed',
                variant: 'destructive',
            });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast({ title: 'Logged out' });
    };


    // Helper to update balance locally after generation/approval
    const updateBalance = (newBalance) => {
        const updated = { ...user, token_balance: newBalance };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, updateBalance }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
