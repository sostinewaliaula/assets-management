import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { MailIcon, SunIcon, MoonIcon } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const {
    forgotPassword
  } = useAuth();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const { addToast } = useNotifications();
  const isDark = theme === 'dark';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    
    try {
      await forgotPassword(email);
      setMessage('Password reset instructions have been sent to your email. Please check your inbox and follow the link to reset your password.');
      setEmailSent(true);
      addToast({
        title: 'Email Sent',
        message: 'Password reset instructions have been sent to your email.',
        type: 'success',
        duration: 5000
      });
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email.';
      
      // Handle specific Supabase errors
      if (err?.message) {
        if (err.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (err.message.includes('rate limit')) {
          errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before requesting a password reset.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      addToast({
        title: 'Email Failed',
        message: errorMessage,
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setEmail('');
    setError('');
    setMessage('');
    setEmailSent(false);
  };

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
                  {isDark ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
              <div className="flex justify-center mb-8">
                <h1 className="text-2xl font-bold text-primary">Turnkey</h1>
                <h1 className="ml-2 text-2xl font-bold text-secondary">Africa</h1>
              </div>
              <h1 className="mb-4 text-xl font-bold text-primary dark:text-primary">Forgot Password</h1>
              {error && <div className="px-4 py-2 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
              {message && <div className="px-4 py-2 mb-4 text-sm text-primary bg-lightgreen dark:bg-green-900 dark:text-green-200 rounded-md">{message}</div>}
              
              {!emailSent ? (
                <>
                  <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <label className="block text-sm">
                      <span className="text-primary dark:text-primary">Email</span>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <MailIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                          className="block w-full pl-10 mt-1 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl form-input focus:border-primary focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-40" 
                          placeholder="your@email.com" 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                    </label>
                    <button 
                      type="submit" 
                      className="button-primary block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Recover Password'}
                    </button>
                  </form>
                  <hr className="my-8" />
                  <p className="mt-4">
                    <Link className="text-sm font-medium text-secondary hover:underline" to="/login">Back to Login</Link>
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleResetForm}
                      className="w-full px-4 py-2 text-sm font-medium text-secondary border border-secondary rounded-lg hover:bg-secondary hover:text-white transition-colors"
                    >
                      Send to Different Email
                    </button>
                    <Link
                      to="/login"
                      className="block w-full px-4 py-2 text-sm font-medium text-center text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;