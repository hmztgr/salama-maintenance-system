'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextFirebase';

export interface LoginProps {
  onLoginSuccess?: () => void;
  className?: string;
}

export function Login({ onLoginSuccess, className = '' }: LoginProps) {
  const router = useRouter();
  const { authState, login } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      return;
    }

    try {
      const success = await login(credentials.email, credentials.password);
      if (success && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Login submission error:', error);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickLogin = async (email: string, password: string) => {
    try {
      const success = await login(email, password);
      if (success && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Quick login error:', error);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            شركة سلامة السعودية
          </h1>
          <h2 className="text-xl text-gray-600 mb-8">
            نظام إدارة جدولة الصيانة
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="أدخل البريد الإلكتروني"
              disabled={authState.isLoading}
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل كلمة المرور"
                disabled={authState.isLoading}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {authState.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm text-center">{authState.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={authState.isLoading || !credentials.email || !credentials.password}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {authState.isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </form>

        {/* Quick Login Buttons for Testing */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">تسجيل دخول سريع باستخدام Firebase:</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleQuickLogin('admin@salamasaudi.com', 'admin123456')}
              disabled={authState.isLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔧 دخول كمدير Firebase (Admin)
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">بيانات Firebase:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• البريد الإلكتروني: admin@salamasaudi.com</div>
            <div>• كلمة المرور: admin123456</div>
            <div>• الصفة: مدير النظام</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Safe default props
Login.defaultProps = {
  className: '',
};
