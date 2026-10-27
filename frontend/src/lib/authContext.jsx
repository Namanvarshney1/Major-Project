/**
 * PrepPulse Authentication React Context & Hook
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('preppulse_token'));
    const [isLoading, setIsLoading] = useState(true);
    const fetchUserProfile = async () => {
        try {
            if (localStorage.getItem('preppulse_token')) {
                const userData = await api.auth.getProfile();
                setUser(userData);
            }
            else {
                setUser(null);
            }
        }
        catch {
            localStorage.removeItem('preppulse_token');
            setToken(null);
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchUserProfile();
    }, [token]);
    const login = async (email, password) => {
        const data = await api.auth.login({ email, password });
        localStorage.setItem('preppulse_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };
    const register = async (name, email, password, profile) => {
        const data = await api.auth.register({ name, email, password, profile });
        localStorage.setItem('preppulse_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };
    const logout = () => {
        localStorage.removeItem('preppulse_token');
        setToken(null);
        setUser(null);
    };
    const refreshUser = async () => {
        await fetchUserProfile();
    };
    return (<AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token && !!user,
            isLoading,
            login,
            register,
            logout,
            refreshUser,
        }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
