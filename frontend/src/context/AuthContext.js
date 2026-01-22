import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';
import { authStorage } from '../lib/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loadUser = useCallback(async () => {
        const token = authStorage.getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await authApi.getMe();
            setUser(userData);
            setIsAuthenticated(true);
            authStorage.setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
            authStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const response = await authApi.login({ email, password });
        authStorage.setToken(response.access_token);
        authStorage.setUser(response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
    };

    const register = async (email, password, firstName, lastName) => {
        const response = await authApi.register({ 
            email, 
            password, 
            first_name: firstName, 
            last_name: lastName 
        });
        authStorage.setToken(response.access_token);
        authStorage.setUser(response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
    };

    const logout = () => {
        authStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        setUser(userData);
        authStorage.setUser(userData);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        loadUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
