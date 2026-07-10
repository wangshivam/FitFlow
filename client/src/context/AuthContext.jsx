import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user;
  const isPremium = user?.tier === 'premium';
  const isOnboarded = profile?.onboarding_complete === true;

  // Fetch current user on mount
  useEffect(() => {
    const token = localStorage.getItem('fitflow_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data } = await authAPI.me();
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      localStorage.removeItem('fitflow_token');
      localStorage.removeItem('fitflow_refresh_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('fitflow_token', data.token);
      localStorage.setItem('fitflow_refresh_token', data.refresh_token);
      setUser(data.user);
      setProfile(data.profile);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.register({ name, email, password });
      localStorage.setItem('fitflow_token', data.token);
      localStorage.setItem('fitflow_refresh_token', data.refresh_token);
      setUser(data.user);
      setProfile(data.profile);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fitflow_token');
    localStorage.removeItem('fitflow_refresh_token');
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const { data } = await profileAPI.update(profileData);
      setProfile(data.profile);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update profile.');
    }
  }, []);

  const completeOnboarding = useCallback(async (onboardingData) => {
    try {
      const { data } = await profileAPI.onboarding(onboardingData);
      setProfile(data.profile);
      setUser((prev) => ({ ...prev, ...data.user }));
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to save onboarding data.');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isPremium,
    isOnboarded,
    login,
    register,
    logout,
    updateProfile,
    completeOnboarding,
    refreshUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
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
