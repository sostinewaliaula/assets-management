import React, { useEffect, useState, createContext, useContext } from 'react';
// Define types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'department_officer' | 'user';
  departmentId?: string;
}
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      // In a real app, this would verify the token with your backend
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);
  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call to your backend
      // For demo purposes, we'll simulate a successful login with mock data
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : 'user'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  // Forgot password function
  const forgotPassword = async (email: string) => {
    // In a real app, this would make an API call to your backend
    return new Promise<void>(resolve => {
      setTimeout(() => {
        console.log(`Password reset email sent to ${email}`);
        resolve();
      }, 1000);
    });
  };
  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    // In a real app, this would make an API call to your backend
    return new Promise<void>(resolve => {
      setTimeout(() => {
        console.log(`Password reset with token ${token}`);
        resolve();
      }, 1000);
    });
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