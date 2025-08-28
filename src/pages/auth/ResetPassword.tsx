import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LockIcon, SunIcon, MoonIcon, AlertCircleIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';

  // Check if we have a valid recovery token
  useEffect(() => {
    const checkRecoveryToken = async () => {
      try {
        // Check if we have a session (user clicked recovery link)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setIsValidToken(false);
        } else if (session?.user) {
          // User has a valid session from recovery link
          setIsValidToken(true);
        } else {
          // Check if we have access_token in URL params (fallback)
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session manually
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (setSessionError) {
              console.error('Error setting session:', setSessionError);
              setIsValidToken(false);
            } else {
              setIsValidToken(true);
            }
          } else {
            setIsValidToken(false);
          }
        }
      } catch (error) {
        console.error('Error checking recovery token:', error);
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidToken) {
      setError('Invalid or expired recovery link. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      addToast({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.',
        type: 'error',
        duration: 5000
      });
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      addToast({
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters long.',
        type: 'error',
        duration: 5000
      });
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await resetPassword(password);
      setMessage('Password has been reset successfully.');
      addToast({
        title: 'Password Reset',
        message: 'Your password has been reset successfully.',
        type: 'success',
        duration: 5000
      });
      
      // Sign out the user after password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
      addToast({
        title: 'Reset Failed',
        message: 'Failed to reset password. Please try again.',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="flex items-center min-h-screen p-6 bg-lightgreen dark:bg-gray-950">
        <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Verifying recovery link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <div className="flex items-center min-h-screen p-6 bg-lightgreen dark:bg-gray-950">
        <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Invalid Recovery Link
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This password recovery link is invalid or has expired. Please request a new password reset.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Request New Reset
              </Link>
              <div className="mt-4">
                <Link
                  className="text-sm text-secondary hover:underline"
                  to="/login"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center min-h-screen p-6 bg-lightgreen dark:bg-gray-950">
    <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="flex flex-col overflow-y-auto md:flex-row">
        <div className="h-32 md:h-auto md:w-1/2">
            <img
              aria-hidden="true"
              className="object-cover w-full h-full rounded-l-2xl"
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
              alt="Office"
            />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-12 md:w-1/2">
          <div className="w-full">
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary"
                aria-label="Toggle color mode"
              >
                  {isDark ? (
                    <SunIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <MoonIcon className="w-5 h-5 text-gray-600" />
                  )}
              </button>
            </div>
            <div className="flex flex-col items-center mb-8">
              <img src="http://ticket.turnkey.local:8080/scp/logo.php?login" alt="Caava Group" className="h-12 w-auto mb-2" />
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary">Caava</h1>
                <h1 className="ml-2 text-2xl font-bold text-secondary">Group</h1>
              </div>
            </div>
              <h1 className="mb-4 text-xl font-bold text-primary dark:text-primary">
                Reset Password
              </h1>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Enter your new password below. Make sure it's at least 8 characters long.
              </p>
              {error && (
                <div className="px-4 py-2 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}
              {message && (
                <div className="px-4 py-2 mb-4 text-sm text-primary bg-lightgreen dark:bg-green-900 dark:text-green-200 rounded-md">
                  {message}
                </div>
              )}
              <form onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="text-gray-700 dark:text-gray-300">New Password</span>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                    <input
                      className="block w-full pl-10 mt-1 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl form-input focus:border-primary focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-40"
                      placeholder="************"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                </div>
              </label>
              <label className="block mt-4 text-sm">
                <span className="text-gray-700 dark:text-gray-300">Confirm Password</span>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                    <input
                      className="block w-full pl-10 mt-1 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl form-input focus:border-primary focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-40"
                      placeholder="************"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                </div>
              </label>
                <button
                  type="submit"
                  className="button-primary block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            <hr className="my-8" />
            <p className="mt-4">
                <Link
                  className="text-sm font-medium text-secondary hover:underline"
                  to="/login"
                >
                  Back to Login
                </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ResetPassword;