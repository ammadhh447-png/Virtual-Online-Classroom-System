import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/signin`, { identifier, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/admin-login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const signup = async (userData) => {
    try {
      const payload = {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email || '',
        password: userData.password,
        role: userData.role || 'student'
      };

      // For students, add roll number components
      if (userData.role === 'student' || !userData.role) {
        payload.rollYear = userData.rollYear;
        payload.rollDept = userData.rollDept;
        payload.rollSerial = userData.rollSerial;
      }

      await axios.post(`${API}/api/auth/signup`, payload);
      // after successful signup, signin to get token
      const identifier = userData.email;
      const loginRes = await login(identifier, userData.password);
      if (loginRes.success) return { success: true };
      return { success: false, message: 'Signed up but failed to login automatically.' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put(`${API}/api/auth/profile`, userData);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const value = {
    user,
    login,
    adminLogin,
    signup,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
