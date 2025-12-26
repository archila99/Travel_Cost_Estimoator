import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // In a real app, we would validate the token with an endpoint like /me
            // For now, we decode basic info or just assume valid until 401
            setUser({ email: parseJwt(token).sub });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        localStorage.setItem('token', data.access_token);
        setUser({ email: email });
        return data;
    };

    const register = async (email, password) => {
        await api.register(email, password);
        return login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

// Helper to decode JWT payload safely
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return {};
    }
}
