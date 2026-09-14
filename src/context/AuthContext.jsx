import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabase, isDemoMode } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session loading
    const initializeAuth = async () => {
      try {
        const { session: currentSession, user: currentUser } = await authService.getSession();
        setSession(currentSession);
        setUser(currentUser);
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to Supabase auth changes if not demo mode
    let subscription = null;
    if (!isDemoMode) {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signUp = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.signUp(credentials);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.signIn(credentials);
      if (result.user) {
        setUser(result.user);
        setSession(result.session);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (newRole) => {
    setLoading(true);
    try {
      const updatedUser = await authService.switchRole(newRole);
      if (updatedUser) {
        setUser({ ...updatedUser });
      }
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'citizen',
        isMunicipal: user?.role === 'municipal_authority',
        session,
        loading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        resetPassword,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
