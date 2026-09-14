import { supabase, isDemoMode } from '../lib/supabase';

// Mock session for demo mode when Supabase is not connected
let mockDemoUser = null;

// Helper to attach role from profiles or metadata
const attachUserRole = async (user) => {
  if (!user) return user;
  
  // Default role from metadata or citizen
  let userRole = user.user_metadata?.role || 'citizen';

  if (!isDemoMode && user.id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role) {
        userRole = profile.role;
      }
    } catch (e) {
      console.warn('Profile role fetch notice:', e);
    }
  }

  user.role = userRole;
  return user;
};

export const authService = {
  async signUp({ fullName, email, password, role = 'citizen' }) {
    if (isDemoMode) {
      await new Promise(res => setTimeout(res, 600)); // Simulate async network call
      mockDemoUser = {
        id: 'demo-user-123',
        email,
        role: role || 'citizen',
        user_metadata: { full_name: fullName, role: role || 'citizen' }
      };
      localStorage.setItem('urbanflood_demo_session', JSON.stringify(mockDemoUser));
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
            full_name: fullName,
            role: role || 'citizen'
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(error.message || 'Unable to register account. Please check your credentials.');
      }

      if (data.user) {
        await attachUserRole(data.user);
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
      
      const isOfficer = email.toLowerCase().includes('officer') || 
                        email.toLowerCase().includes('municipal') || 
                        email.toLowerCase().includes('dmc') || 
                        email.toLowerCase().includes('gov');
      
      const role = isOfficer ? 'municipal_authority' : 'citizen';
      const name = isOfficer ? 'Dibrugarh Municipal Officer' : 'Citizen Contributor';

      mockDemoUser = {
        id: isOfficer ? 'demo-officer-999' : 'demo-citizen-123',
        email: email || (isOfficer ? 'officer@dibrugarh.gov.in' : 'citizen@dibrugarh.in'),
        role: role,
        user_metadata: { full_name: name, role: role }
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

      if (data.user) {
        await attachUserRole(data.user);
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
        if (!mockDemoUser.role) {
          mockDemoUser.role = mockDemoUser.user_metadata?.role || 'citizen';
        }
        return { session: { user: mockDemoUser }, user: mockDemoUser };
      }
      return { session: null, user: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session?.user) {
        await attachUserRole(data.session.user);
      }
      return { session: data.session, user: data.session?.user || null };
    } catch (err) {
      console.error('GetSession Error:', err);
      return { session: null, user: null };
    }
  },

  /**
   * Switch role in current session (for easy evaluation / live demo testing)
   */
  async switchRole(newRole) {
    if (isDemoMode) {
      const saved = localStorage.getItem('urbanflood_demo_session');
      const currentUser = saved ? JSON.parse(saved) : (mockDemoUser || { id: 'demo-user-123' });
      currentUser.role = newRole;
      currentUser.user_metadata = {
        ...(currentUser.user_metadata || {}),
        role: newRole,
        full_name: newRole === 'municipal_authority' ? 'Dibrugarh Municipal Officer' : 'Citizen Contributor'
      };
      mockDemoUser = currentUser;
      localStorage.setItem('urbanflood_demo_session', JSON.stringify(currentUser));
      return currentUser;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', user.id);
        user.role = newRole;
        return user;
      }
    } catch (e) {
      console.warn('Switch role update error:', e);
    }
    return null;
  }
};
