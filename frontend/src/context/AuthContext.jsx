import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hotel_user_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hotel_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('hotel_auth_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('hotel_user_data', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }

    initAuth();

    const handleAutoLogout = () => logout();
    window.addEventListener('auth-logout', handleAutoLogout);
    return () => window.removeEventListener('auth-logout', handleAutoLogout);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.data);
      localStorage.setItem('hotel_auth_token', res.token);
      localStorage.setItem('hotel_user_data', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.data);
      localStorage.setItem('hotel_auth_token', res.token);
      localStorage.setItem('hotel_user_data', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hotel_auth_token');
    localStorage.removeItem('hotel_user_data');
  };

  const isManager = user?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, token, loading, isManager, login, register, logout }}>
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
