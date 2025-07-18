'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { signInUser, signOutUser, createUser } from '@/lib/firebase/auth';

export function FirebaseAuthTest() {
  const [email, setEmail] = useState('admin@salamasaudi.com');
  const [password, setPassword] = useState('admin123456');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    user?: any;
  }>({ type: null, message: '' });

  const testLogin = async () => {
    setLoading(true);
    setResult({ type: null, message: 'Testing Firebase login...' });

    try {
      console.log('🔐 Testing Firebase Auth login...');
      const userProfile = await signInUser(email, password);

      console.log('✅ Login successful:', userProfile);
      setResult({
        type: 'success',
        message: `تم تسجيل الدخول بنجاح! مرحباً ${userProfile.displayName}`,
        user: userProfile
      });

      // Test logout after 3 seconds
      setTimeout(async () => {
        try {
          await signOutUser();
          console.log('✅ Logout successful');
          setResult(prev => ({
            ...prev,
            message: prev.message + ' ✅ وتم تسجيل الخروج بنجاح'
          }));
        } catch (error) {
          console.error('❌ Logout failed:', error);
        }
      }, 3000);

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setResult({
        type: 'error',
        message: `فشل تسجيل الدخول: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    setResult({ type: null, message: 'Creating admin user...' });

    try {
      console.log('👤 Creating admin user...');
      const userProfile = await createUser(email, password, {
        displayName: 'مدير النظام',
        role: 'admin'
      });

      console.log('✅ Admin user created:', userProfile);
      setResult({
        type: 'success',
        message: `تم إنشاء المدير بنجاح! ${userProfile.displayName}`,
        user: userProfile
      });

    } catch (error: any) {
      console.error('❌ User creation failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        setResult({
          type: 'error',
          message: 'المستخدم موجود بالفعل - جرب تسجيل الدخول بدلاً من ذلك'
        });
      } else {
        setResult({
          type: 'error',
          message: `فشل إنشاء المستخدم: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Firebase Authentication Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Test Firebase authentication by creating an admin user or logging in with existing credentials.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@salamasaudi.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123456"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={createAdminUser}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              "Create Admin User"
            )}
          </Button>

          <Button
            onClick={testLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              "Test Login"
            )}
          </Button>
        </div>

        {result.type && (
          <Alert className={
            result.type === 'success' ?
            'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }>
            <div className="flex items-center gap-2">
              {result.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </div>
          </Alert>
        )}

        {result.user && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">User Profile Data:</h4>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(result.user, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
