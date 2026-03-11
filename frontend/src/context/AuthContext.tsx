import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  ciudad: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, userType: string, ciudad: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('Granada');

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedCity = await AsyncStorage.getItem('selectedCity');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      if (storedCity) {
        setSelectedCity(storedCity);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSelectedCity = async (city: string) => {
    setSelectedCity(city);
    await AsyncStorage.setItem('selectedCity', city);
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    setSelectedCity(userData.ciudad || 'Granada');
  };

  const register = async (email: string, password: string, name: string, userType: string, ciudad: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      name,
      user_type: userType,
      ciudad,
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    setSelectedCity(ciudad);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, selectedCity, setSelectedCity: handleSetSelectedCity, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
