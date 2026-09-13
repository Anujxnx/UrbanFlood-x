import { supabase, isDemoMode } from '../lib/supabase';

// Mock session for demo mode when Supabase is not connected
let mockDemoUser = null;

export const authService = {
  async signUp({ fullName, email, password }) {
    if (isDemoMode) {
      await new Promise(res => setTimeout(res, 600)); // Simulate async network call
      mockDemoUser = {
        id: 'demo-user-123',
        email,
        user_metadata: { full_name: fullName }
      };
      return {
        user: mockDemoUser,
        session: { user: mockDemoUser },
        message: 'Account created successfully (Demo Mode).'
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(error.message || 'Unable to register account. Please check your credentials.');
      }

      return {
        user: data.user,
        session: data.session,
        message: 'Account created successfully. Please verify your email if confirmation is required.'
      };
    } catch (err) {
      console.error('SignUp Error:', err);
      throw err;
    }
  },

  async signIn({ email, password }) {
    if (isDemoMode) {
      await new Promise(res => setTimeout(res, 600));
      if (!email || !password) {
        throw new Error('Please provide both email and password.');
      }
      mockDemoUser = {
        id: 'demo-user-123',
        email: email || 'demo@urbanflood.ai',
        user_metadata: { full_name: 'Dibrugarh Municipal Officer' }
      };
      localStorage.setItem('urbanflood_demo_session', JSON.stringify(mockDemoUser));
      return { user: mockDemoUser, session: { user: mockDemoUser } };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Email not verified. Please check your inbox for verification email.');
        }
        throw new Error(error.message || 'Unable to sign in. Please try again.');
      }

      return data;
    } catch (err) {
      console.error('SignIn Error:', err);
      throw err;
    }
  },

  async signOut() {
    if (isDemoMode) {
      mockDemoUser = null;
      localStorage.removeItem('urbanflood_demo_session');
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      return { error: null };
    } catch (err) {
      console.error('SignOut Error:', err);
      throw err;
    }
  },

  async resetPassword(email) {
    if (isDemoMode) {
      await new Promise(res => setTimeout(res, 500));
      return { message: 'Password reset email sent (Demo Mode).' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw new Error(error.message || 'Unable to send password reset email.');

      return { message: 'Password reset link sent to your email.' };
    } catch (err) {
      console.error('ResetPassword Error:', err);
      throw err;
    }
  },

  async getSession() {
    if (isDemoMode) {
      const saved = localStorage.getItem('urbanflood_demo_session');
      if (saved) {
        mockDemoUser = JSON.parse(saved);
        return { session: { user: mockDemoUser }, user: mockDemoUser };
      }
      return { session: null, user: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, user: data.session?.user || null };
    } catch (err) {
      console.error('GetSession Error:', err);
      return { session: null, user: null };
    }
  }
};
