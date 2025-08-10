import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LockIcon, SunIcon, MoonIcon } from 'lucide-react';
const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const {
    resetPassword
  } = useAuth();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';
  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid password reset link.');
    }
  }, [location]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setMessage('Password has been reset successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="flex items-center min-h-screen p-6 bg-lightgreen dark:bg-gray-950">
    <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className="flex flex-col overflow-y-auto md:flex-row">
        <div className="h-32 md:h-auto md:w-1/2">
          <img aria-hidden="true" className="object-cover w-full h-full rounded-l-2xl" src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" alt="Office" />
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
            <h1 className="mb-4 text-xl font-bold text-primary dark:text-primary">Reset Password</h1>
            {error && <div className="px-4 py-2 mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">{error}</div>}
            {message && <div className="px-4 py-2 mb-4 text-sm text-primary bg-lightgreen dark:bg-green-900 dark:text-green-200 rounded-md">{message}</div>}
            {token && <form onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="text-gray-700 dark:text-gray-300">New Password</span>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input className="block w-full pl-10 mt-1 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl form-input focus:border-primary focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-40" placeholder="************" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                </div>
              </label>
              <label className="block mt-4 text-sm">
                <span className="text-gray-700 dark:text-gray-300">Confirm Password</span>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input className="block w-full pl-10 mt-1 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl form-input focus:border-primary focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-40" placeholder="************" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                </div>
              </label>
              <button type="submit" className="button-primary block w-full px-4 py-2 mt-4 text-sm font-medium leading-5 text-center" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</button>
            </form>}
            <hr className="my-8" />
            <p className="mt-4">
              <Link className="text-sm font-medium text-secondary hover:underline" to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
export default ResetPassword;