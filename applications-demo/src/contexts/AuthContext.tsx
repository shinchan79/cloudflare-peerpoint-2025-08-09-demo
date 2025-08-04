import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { User } from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    setCurrentUser, 
    setAuthenticated, 
    currentUser,
    isAuthenticated 
  } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            setCurrentUser(response.data.data);
            setAuthenticated(true);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setCurrentUser, setAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('auth_token', token);
        setCurrentUser(user);
        setAuthenticated(true);
        toast.success('Welcome back!');
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/register', { name, email, password });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('auth_token', token);
        setCurrentUser(user);
        setAuthenticated(true);
        toast.success('Account created successfully!');
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await api.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
      setAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await api.put('/api/auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCurrentUser(response.data.data);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Profile update failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    login,
    register,
    logout,
    updateProfile,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 