import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define types based on your existing schema
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user'; // Updated to match your schema
  departmentId?: string;
  phone?: string;
  position?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase user to our User type
  const convertSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Get user profile from our users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as 'admin' | 'manager' | 'user',
        departmentId: profile.department_id || undefined,
        phone: profile.phone || undefined,
        position: profile.position || undefined,
        is_active: profile.is_active
      };
    } catch (error) {
      console.error('Error converting user:', error);
      return null;
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const userData = await convertSupabaseUser(session.user);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await convertSupabaseUser(session.user);
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const userData = await convertSupabaseUser(data.user);
        if (!userData) {
          throw new Error('User profile not found in database');
        }
        setUser(userData);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};